"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { db as prisma } from "@/lib/db";

export type CreateCustomerPaymentInput = {
    deliveryId: string; // The Invoice/Delivery ID
    date: Date;
    method: string; // CASH, NOSTRO, NOSTRO / BANK
    amount: number;
};

// Helper to retry database operations
async function withRetry<T>(operation: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
    try {
        return await operation();
    } catch (error) {
        if (retries > 0) {
            console.warn(`Database operation failed, retrying... (${retries} attempts left). Error: ${error}`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return withRetry(operation, retries - 1, delay * 2);
        }
        throw error;
    }
}

export async function createCustomerPayment(input: CreateCustomerPaymentInput) {
    console.log("Attempting to record customer payment:", input);
    try {
        const result = await withRetry(async () => {
            return await prisma.$transaction(async (tx) => {
                // 1. Fetch Delivery to get Context (Deal, Customer)
                const delivery = await tx.delivery.findUnique({
                    where: { id: input.deliveryId },
                    include: {
                        deal: {
                            include: { customer: true }
                        },
                        payments: true
                    }
                });

                if (!delivery) throw new Error("Delivery/Invoice not found");

                // 2. Create Payment Record
                const payment = await tx.customerPayment.create({
                    data: {
                        deliveryId: input.deliveryId,
                        date: input.date,
                        method: input.method,
                        amount: input.amount,
                    }
                });

                // 3. Update Delivery Status
                const totalPaid = delivery.payments.reduce((sum, p) => sum + Number(p.amount), 0) + input.amount;
                const invoiceAmount = Number(delivery.invoiceAmount);

                let newStatus = "Unpaid";
                if (totalPaid >= invoiceAmount - 0.01) { // Tolerance
                    newStatus = "Paid";
                } else if (totalPaid > 0) {
                    newStatus = "Part Paid";
                }

                await tx.delivery.update({
                    where: { id: input.deliveryId },
                    data: { status: newStatus }
                });

                // 4. Create CashBook Entry (Inward)
                // Logic: 
                // - If CASH -> cashIn
                // - If NOSTRO or BANK -> bankIn
                const isCash = input.method === "CASH";

                await tx.cashBook.create({
                    data: {
                        date: input.date,
                        description: `Customer Payment - ${delivery.deal.customer.name} - ${delivery.invoiceNumber}`,
                        category: "Trade Receipts",
                        dealId: delivery.deal.id,
                        cashIn: isCash ? input.amount : 0,
                        bankIn: isCash ? 0 : input.amount,
                        // Zero the others
                        cashOut: 0,
                        bankOut: 0
                    }
                });

                return payment;
            });
        });

        revalidatePath("/customer-payments");
        revalidatePath("/receivables");
        revalidatePath("/treasury");

        return { success: true, data: result };
    } catch (error: any) {
        console.error("Failed to record customer payment:", error);
        return { success: false, error: error.message || "Failed to record payment" };
    }
}

export async function getCustomerPayments() {
    try {
        const payments = await prisma.customerPayment.findMany({
            include: {
                delivery: {
                    include: {
                        deal: {
                            include: {
                                customer: true,
                                commodity: true
                            }
                        }
                    }
                }
            },
            orderBy: { date: 'desc' }
        });

        return payments.map(p => {
            // Safety check for relations
            if (!p.delivery || !p.delivery.deal) {
                console.error(`Payment ${p.id} has missing relations`, p);
                return null;
            }

            return {
                id: p.id,
                date: p.date,
                dealId: p.delivery.dealId,
                customerName: p.delivery.deal.customer?.name || "Unknown",
                commodityName: p.delivery.deal.commodity?.name || "Unknown",
                invoiceNumber: p.delivery.invoiceNumber,
                method: p.method,
                amount: Number(p.amount)
            };
        }).filter(p => p !== null); // Remove any failed mappings
    } catch (error) {
        console.error("Failed to fetch customer payments:", error);
        return [];
    }
}

export async function getOpenInvoices() {
    // Fetch deliveries that are not fully paid
    const deliveries = await prisma.delivery.findMany({
        where: {
            invoiceNumber: { not: "" }, // Must have an invoice
            status: { not: "Paid" } // Only show unpaid or part-paid
        },
        include: {
            deal: {
                include: { customer: true }
            },
            payments: true
        },
        orderBy: { date: 'desc' }
    });

    return deliveries.map(d => {
        const totalPaid = d.payments.reduce((sum, p) => sum + Number(p.amount), 0);
        const outstanding = Number(d.invoiceAmount) - totalPaid;

        return {
            id: d.id,
            dealId: d.dealId,
            customerName: d.deal.customer.name,
            invoiceNumber: d.invoiceNumber,
            invoiceAmount: Number(d.invoiceAmount),
            outstandingAmount: outstanding,
            status: d.status
        };
    }).filter(d => d.outstandingAmount > 0.01); // Double check outstanding > 0
}

export async function deleteCustomerPayment(id: string) {
    try {
        // Ideally we should also delete from CashBook. 
        // Current constraint: We don't store CashBook ID on Payment.
        // We will just delete the payment record for now.
        await prisma.customerPayment.delete({ where: { id } });

        revalidatePath("/customer-payments");
        revalidatePath("/receivables");
        revalidatePath("/treasury");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete payment:", error);
        return { success: false, error: "Failed to delete payment" };
    }
}

export async function updateCustomerPayment(id: string, data: { date: Date; amount: number; method: string }) {
    try {
        await prisma.customerPayment.update({
            where: { id },
            data: {
                date: data.date,
                amount: data.amount,
                method: data.method
            }
        });

        // Note: Ideally we should update the CashBook too. 
        // But since we don't have a direct link, we'll leave it for now or assume user fixes it manually?
        // Or we could try to find a matching cashbook entry by amount/date/desc? Too risky.
        // LIMITATION: Editing payment does NOT auto-update cashbook for now.

        revalidatePath("/customer-payments");
        revalidatePath("/receivables");
        revalidatePath("/treasury");
        return { success: true };
    } catch (error) {
        console.error("Failed to update payment:", error);
        return { success: false, error: "Failed to update payment" };
    }
}
