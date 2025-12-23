"use server";

import { PrismaClient } from "@prisma/client";
import { db as prisma } from "@/lib/db";

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

export type ReportsData = {
    pl: {
        totalRevenue: number;
        totalCOGS: number;
        grossProfit: number;
        marginPercentage: number;
    };
    inventory: {
        totalContracted: number;
        totalDelivered: number;
        totalOutstanding: number;
        stockValue: number;
    };
    receivables: {
        totalInvoiced: number;
        totalReceived: number;
        outstandingBalance: number;
        overdueAmount: number; // Placeholder logic
    };
    debt: {
        totalBorrowed: number;
        totalRepaid: number;
        outstandingPrincipal: number;
    };
};

export async function getReportsData(): Promise<ReportsData> {
    try {
        return await withRetry(async () => {
            // Fetch all necessary data in parallel
            const [deals, deliveries, loans] = await Promise.all([
                prisma.deal.findMany({ include: { deliveries: true } }),
                prisma.delivery.findMany({ include: { payments: true } }),
                prisma.loan.findMany({ include: { repayments: true } })
            ]);

            // 1. P&L Calculation
            // Revenue = Sum of (Deals Offtake Price * Deal Quantity) OR Actual Invoiced Amount?
            // "Trading Business": Revenue is usually recognized on Delivery (Invoice). 
            // Let's use Invoiced Amount for Realized Revenue, and Deal value for Projected. 
            // For this summary, let's look at REALIZED (Delivered) P&L.

            let totalRevenue = 0;
            let totalCOGS = 0;

            deliveries.forEach(d => {
                totalRevenue += Number(d.invoiceAmount);
                // COGS for this delivery = Quantity * SupplierPrice (need to look up from deal)
                const deal = deals.find(x => x.id === d.dealId);
                if (deal) {
                    totalCOGS += (d.quantity * Number(deal.supplierPricePerTon));
                }
            });

            const grossProfit = totalRevenue - totalCOGS;
            const marginPercentage = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

            // 2. Inventory Position
            let totalContracted = 0;
            let totalDelivered = 0;
            let stockValue = 0; // Value of goods NOT yet delivered but contracted? Or goods in warehouse?
            // "Stock / Inventory @ Cost" usually means what we own but haven't sold.
            // In back-to-back trading, inventory is transient. 
            // Let's metric: "Outstanding to be customer-delivered".

            deals.forEach(deal => {
                totalContracted += Number(deal.quantity);
                const deliveredForDeal = deal.deliveries.reduce((sum, del) => sum + del.quantity, 0);
                totalDelivered += deliveredForDeal;

                // If we bought it but haven't delivered it, it's inventory.
                // Simplified: (Contracted - Delivered) * SupplierPrice
                const remaining = Number(deal.quantity) - deliveredForDeal;
                if (remaining > 0) {
                    stockValue += (remaining * Number(deal.supplierPricePerTon));
                }
            });

            const totalOutstanding = totalContracted - totalDelivered;

            // 3. Receivables
            let totalInvoiced = 0;
            let totalReceived = 0;

            deliveries.forEach(d => {
                totalInvoiced += Number(d.invoiceAmount);
                const paid = d.payments.reduce((sum, p) => sum + Number(p.amount), 0);
                totalReceived += paid;
            });

            const outstandingReceivables = totalInvoiced - totalReceived;

            // 4. Debt Profile
            let totalBorrowed = 0;
            let totalRepaid = 0;

            loans.forEach(l => {
                totalBorrowed += Number(l.principal);
                const repaid = l.repayments.reduce((sum, r) => sum + Number(r.amount), 0);
                totalRepaid += repaid;
            });

            // Note: Outstanding includes interest? Usually yes, but let's stick to Principal + Interest (Maturity Value) logic if possible.
            // For now, let's just do simple Principal balance for the "Debt Profile".
            // actually, we should probably use the computed outstanding from financing logic if we want consistency.
            // Let's strive for simple Principal tracking here for the dashboard summary.
            const outstandingPrincipal = totalBorrowed - totalRepaid;

            return {
                pl: {
                    totalRevenue,
                    totalCOGS,
                    grossProfit,
                    marginPercentage
                },
                inventory: {
                    totalContracted,
                    totalDelivered,
                    totalOutstanding,
                    stockValue
                },
                receivables: {
                    totalInvoiced,
                    totalReceived,
                    outstandingBalance: outstandingReceivables,
                    overdueAmount: 0 // TODO: complexity
                },
                debt: {
                    totalBorrowed,
                    totalRepaid,
                    outstandingPrincipal
                }
            };
        });
    } catch (error) {
        console.error("Failed to load reports data:", error);
        // Return zeros on failure
        return {
            pl: { totalRevenue: 0, totalCOGS: 0, grossProfit: 0, marginPercentage: 0 },
            inventory: { totalContracted: 0, totalDelivered: 0, totalOutstanding: 0, stockValue: 0 },
            receivables: { totalInvoiced: 0, totalReceived: 0, outstandingBalance: 0, overdueAmount: 0 },
            debt: { totalBorrowed: 0, totalRepaid: 0, outstandingPrincipal: 0 }
        };
    }
}
