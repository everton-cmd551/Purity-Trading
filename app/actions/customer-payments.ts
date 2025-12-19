"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

export type CreateCustomerPaymentInput = {
    deliveryId: string; // The Invoice/Delivery ID
    date: Date;
    method: string; // CASH, NOSTRO, NOSTRO / BANK
    amount: number;
};

export async function createCustomerPayment(input: CreateCustomerPaymentInput) {
    try {
        const result = await prisma.$transaction(async (tx) => {
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

        revalidatePath("/customer-payments");
        revalidatePath("/receivables");
        revalidatePath("/treasury");

        return { success: true, data: result };
    } catch (error) {
        console.error("Failed to record customer payment:", error);
        return { success: false, error: "Failed to record payment" };
    }
}

export async function getCustomerPayments() {
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

    return payments.map(p => ({
        id: p.id,
        date: p.date,
        dealId: p.delivery.dealId,
        customerName: p.delivery.deal.customer.name,
        commodityName: p.delivery.deal.commodity.name,
        invoiceNumber: p.delivery.invoiceNumber,
        method: p.method,
        amount: Number(p.amount)
    }));
}

export async function getOpenInvoices() {
    // Fetch deliveries that are not fully paid (or even if they are, maybe we want to allow overpayment? 
    // Spec says "Allow multiple payments per deal", implies we pick from invoices.
    // Let's filter for anything with an invoice number.

    const deliveries = await prisma.delivery.findMany({
        where: {
            invoiceNumber: { not: "" } // Must have an invoice
            // Optionally: status: { not: "Paid" } if we want to strict filter
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
    });
}
