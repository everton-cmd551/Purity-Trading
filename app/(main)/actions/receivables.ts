"use server";

import { PrismaClient } from "@prisma/client";

import { db as prisma } from "@/lib/db";

import { revalidatePath } from "next/cache";

export type CreateDeliveryInput = {
    dealId: string;
    date: Date;
    quantity: number;
    invoiceNumber: string;
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

export async function recordDelivery(input: CreateDeliveryInput) {
    console.log("Attempting to record delivery with input:", input);
    try {
        await withRetry(async () => {
            const deal = await prisma.deal.findUnique({
                where: { id: input.dealId }
            });

            if (!deal) {
                console.error(`Deal not found: ${input.dealId}`);
                throw new Error("Deal not found");
            }

            // Enforce 1 Deal = 1 Delivery
            const existingDelivery = await prisma.delivery.findFirst({
                where: { dealId: input.dealId }
            });
            if (existingDelivery) {
                throw new Error(`Delivery already exists for Deal ${input.dealId}`);
            }

            const invoiceAmount = Number(deal.offtakePricePerTon) * input.quantity;
            console.log(`Calculated invoice amount: ${invoiceAmount} for deal ${deal.id} with price ${deal.offtakePricePerTon}`);

            const delivery = await prisma.delivery.create({
                data: {
                    dealId: input.dealId,
                    date: input.date,
                    quantity: input.quantity,
                    invoiceNumber: input.invoiceNumber,
                    invoiceAmount: invoiceAmount,
                    status: "Unpaid"
                }
            });
            console.log("Delivery created:", delivery);
        });

        revalidatePath("/receivables");
        revalidatePath("/customer-payments");
        return { success: true };
    } catch (error: any) {
        console.error("Failed to record delivery after retries. Error details:", error);
        return { success: false, error: error.message || "Failed to record delivery" };
    }
}

export async function getDealsForDelivery() {
    const deals = await prisma.deal.findMany({
        where: { status: "Open" },
        include: {
            customer: true,
            commodity: true,
            deliveries: true // Include deliveries to calculate remaining qty
        },
        orderBy: { date: 'desc' }
    });

    // Filter deals that are already delivered
    // User Requirement: "Deal note is very unique ID there can not be more than one transaction"
    // Interpretation: One Deal = One Delivery.
    const outstandingDeals = deals.filter(deal => {
        // If there is ANY delivery, this deal is "done" from a delivery recording perspective
        return deal.deliveries.length === 0;
    });

    return outstandingDeals.map(d => ({
        id: d.id,
        customerName: d.customer.name,
        commodityName: d.commodity.name,
        offtakePrice: Number(d.offtakePricePerTon),
        remainingQty: Number(d.quantity)
    }));
}

export async function getReceivablesData() {
    // Fetch all deals and their related deliveries/payments
    // Note: The spec asks for a register that seems to be "Per Delivery" or "Per Invoice", 
    // but also talks about "Contracted Tonnage" which is "Per Deal".
    // We will return a list of Deliveries joined with Deal info. 
    // If a Deal has no deliveries yet, we might want to show it as a row with empty delivery info?
    // The spec says "Tracks what was delivered...". 
    // Let's iterate through Deals and then their Deliveries.

    // However, if we list purely by Deal, we might miss multiple deliveries. 
    // The spec cols 11 (Invoice Number) and 4 (Delivery Date) imply granular rows.
    // So we will fetch Deliveries. 
    // BUT Section 9 "Outstanding Stock" is derived from (Contracted - Delivered). 
    // If we have multiple deliveries, "Delivered" for that row is just that shipment. 
    // The "Outstanding Stock" should probably be the DEAL's remaining stock.

    const deals = await prisma.deal.findMany({
        include: {
            customer: true,
            commodity: true,
            deliveries: {
                include: {
                    payments: true
                }
            }
        },
        orderBy: { date: 'desc' }
    });

    const rows = [];

    for (const deal of deals) {
        // Calculate Deal-level aggregates
        let totalDeliveredForDeal = 0;
        if (deal.deliveries) {
            totalDeliveredForDeal = deal.deliveries.reduce((sum, d) => sum + d.quantity, 0);
        }

        const contractedTonnage = Number(deal.quantity);
        const outstandingStockQty = contractedTonnage - totalDeliveredForDeal;
        const supplierPrice = Number(deal.supplierPricePerTon);
        const stockValueAtCost = outstandingStockQty * supplierPrice; // Value of remaining stock

        // If no deliveries, show one row representing the "Pending" state or just the Deal info?
        // The spec implies tracking deliveries. If nothing delivered, maybe just show the deal with 0 delivered?
        if (deal.deliveries.length === 0) {
            rows.push({
                rowId: `deal-${deal.id}`,
                dealId: deal.id,
                customerName: deal.customer.name,
                commodityName: deal.commodity.name,
                deliveryDate: null,
                cogs: supplierPrice,
                offtakePrice: Number(deal.offtakePricePerTon),
                contractedTonnage: contractedTonnage,
                deliveredQty: 0,
                outstandingStockQty: outstandingStockQty, // All of it
                stockValueAtCost: stockValueAtCost,
                invoiceNumber: '-',
                invoiceAmount: 0,
                receiptAmount: 0,
                outstandingBalance: 0,
                paymentStatus: 'Pending Delivery'
            });
        } else {
            // Create a row per delivery
            for (const delivery of deal.deliveries) {
                const invoiceAmount = Number(delivery.invoiceAmount);
                const receiptAmount = delivery.payments.reduce((sum, p) => sum + Number(p.amount), 0);
                const outstandingBalance = invoiceAmount - receiptAmount;

                let status = "Unpaid";
                if (outstandingBalance <= 0.01 && receiptAmount > 0) status = "Paid";
                else if (outstandingBalance > 0 && receiptAmount > 0) status = "Part Paid";

                rows.push({
                    rowId: `del-${delivery.id}`,
                    dealId: deal.id,
                    customerName: deal.customer.name,
                    commodityName: deal.commodity.name,
                    deliveryDate: delivery.date,
                    cogs: supplierPrice,
                    offtakePrice: Number(deal.offtakePricePerTon),
                    contractedTonnage: contractedTonnage,
                    deliveredQty: delivery.quantity, // This specific delivery
                    // Note: Outstanding stock is usually "Remaining to be delivered". 
                    // Showing it on every row might be repetitive but that's the spec.
                    outstandingStockQty: outstandingStockQty,
                    stockValueAtCost: stockValueAtCost,
                    invoiceNumber: delivery.invoiceNumber || '-',
                    invoiceAmount: invoiceAmount,
                    receiptAmount: receiptAmount,
                    outstandingBalance: outstandingBalance,
                    paymentStatus: status
                });
            }
        }
    }

    return rows;
}

export async function deleteDelivery(id: string) {
    try {
        await prisma.customerPayment.deleteMany({ where: { deliveryId: id } });
        await prisma.delivery.delete({ where: { id } });

        revalidatePath("/receivables");
        revalidatePath("/customer-payments");
        return { success: true };
    } catch (error: any) {
        console.error("Failed to delete delivery:", error);
        return { success: false, error: error.message || "Failed to delete delivery" };
    }
}

export async function updateDelivery(id: string, data: { date: Date; quantity: number; invoiceNumber: string }) {
    try {
        const delivery = await prisma.delivery.findUnique({ where: { id }, include: { deal: true } });
        if (!delivery) return { success: false, error: "Delivery not found" };

        const invoiceAmount = Number(delivery.deal.offtakePricePerTon) * data.quantity;

        await prisma.delivery.update({
            where: { id },
            data: {
                date: data.date,
                quantity: data.quantity,
                invoiceNumber: data.invoiceNumber,
                invoiceAmount
            }
        });

        revalidatePath("/receivables");
        revalidatePath("/customer-payments");
        return { success: true };
    } catch (error) {
        console.error("Failed to update delivery:", error);
        return { success: false, error: "Failed to update delivery" };
    }
}
