"use server";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
