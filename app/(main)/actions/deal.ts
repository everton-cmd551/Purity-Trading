"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { db as prisma } from "@/lib/db";

export type CreateDealInput = {
    id: string; // Deal Note ID (User Input)
    date: Date;
    status: string;

    // Relations
    commodityId: string;
    commodityGrade?: string;
    supplierId: string;
    customerId: string;
    financierId?: string;

    // Economics
    quantity: number;
    supplierPricePerTon: number;
    offtakePricePerTon: number;

    // Terms
    paymentTermsCustomer?: number;
    paymentTermsFinancier?: number;
    dealOwner?: string;
    comments?: string;

    // Loan / Financing (New fields from Excel)
    disbursementDate?: Date;
    loanInterestRate?: number; // Optional, to calculate repayment if needed, or just manual input
    maturityValue?: number; // Manual input or calculated
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

export async function createDeal(input: CreateDealInput) {
    try {
        // Calculate values
        const costValue = input.quantity * input.supplierPricePerTon;
        const expectedSalesValue = input.quantity * input.offtakePricePerTon;
        const expectedGrossMargin = expectedSalesValue - costValue;
        const expectedMarginPercentage = expectedSalesValue > 0 ? (expectedGrossMargin / expectedSalesValue) * 100 : 0;

        if (input.disbursementDate && input.date > input.disbursementDate) {
            return { success: false, error: "Disbursement date cannot be earlier than Deal date." };
        }

        const result = await withRetry(async () => {
            // Simplify: Remove $transaction if it's causing "Unable to start transaction" errors on unstable connection
            // But we have dependent creates (Loan). If connection is surprisingly bad, maybe we keep it sequential without atomic transaction?
            // Let's TRY simple transaction first inside retry. If it keeps failing, we can unroll it.

            return await prisma.$transaction(async (tx) => {
                // 1. Create Deal
                const deal = await tx.deal.create({
                    data: {
                        id: input.id,
                        date: input.date,
                        status: input.status,
                        commodityId: input.commodityId,
                        commodityGrade: input.commodityGrade,
                        supplierId: input.supplierId,
                        customerId: input.customerId,
                        financierId: input.financierId || undefined,
                        quantity: input.quantity,
                        supplierPricePerTon: input.supplierPricePerTon,
                        offtakePricePerTon: input.offtakePricePerTon,
                        costValue,
                        expectedSalesValue,
                        expectedGrossMargin,
                        expectedMarginPercentage,
                        paymentTermsCustomer: input.paymentTermsCustomer,
                        paymentTermsFinancier: input.paymentTermsFinancier,
                        dealOwner: input.dealOwner,
                        comments: input.comments,
                    },
                });

                // 2. Create Loan if Financier and details are present
                if (input.financierId && input.disbursementDate && input.paymentTermsFinancier) {
                    const maturityDate = new Date(input.disbursementDate);
                    maturityDate.setDate(maturityDate.getDate() + input.paymentTermsFinancier);

                    await tx.loan.create({
                        data: {
                            dealId: deal.id,
                            principal: costValue,
                            disbursementDate: input.disbursementDate,
                            paymentTerms: input.paymentTermsFinancier,
                            maturityDate: maturityDate,
                            repaymentAmount: input.maturityValue || costValue,
                            status: "Open"
                        }
                    });
                }

                return deal;
            });
        });

        revalidatePath("/deals");
        return { success: true, deal: result };
    } catch (error: any) {
        if (error.code === 'P2002') {
            return { success: false, error: "Deal Note Number must be unique." };
        }
        console.error("Failed to create deal:", error);
        return { success: false, error: "Failed to create deal." };
    }
}

export async function getDeals() {
    try {
        return await withRetry(async () => {
            return await prisma.deal.findMany({
                orderBy: { date: 'desc' },
                include: {
                    commodity: true,
                    supplier: true,
                    customer: true,
                    financier: true,
                    loan: true
                }
            });
        });
    } catch (error) {
        console.error("Failed to fetch deals:", error);
        return [];
    }
}

export async function getMasterDataOptions() {
    try {
        return await withRetry(async () => {
            const [commodities, suppliers, customers, financiers] = await Promise.all([
                prisma.commodity.findMany(),
                prisma.supplier.findMany(),
                prisma.customer.findMany(),
                prisma.financier.findMany(),
            ]);
            return { commodities, suppliers, customers, financiers };
        });
    } catch (error) {
        console.error("Failed to fetch master data options:", error);
        return { commodities: [], suppliers: [], customers: [], financiers: [] };
    }
}

export async function deleteDeal(dealId: string) {
    try {
        await withRetry(async () => {
            // Delete in order of dependencies

            // 1. Find all deliveries
            const deliveries = await prisma.delivery.findMany({ where: { dealId } });
            for (const delivery of deliveries) {
                await prisma.customerPayment.deleteMany({ where: { deliveryId: delivery.id } });
            }
            await prisma.delivery.deleteMany({ where: { dealId } });

            // 2. Find associated loan and delete repayments
            const loan = await prisma.loan.findFirst({ where: { dealId } });
            if (loan) {
                await prisma.repayment.deleteMany({ where: { loanId: loan.id } });
                await prisma.loan.delete({ where: { id: loan.id } });
            }

            // 3. Delete Deal
            await prisma.deal.delete({ where: { id: dealId } });
        });

        revalidatePath("/deals");
        revalidatePath("/receivables");
        revalidatePath("/financing");
        revalidatePath("/customer-payments");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete deal:", error);
    }
}

export async function updateDeal(dealId: string, data: CreateDealInput) {
    try {
        return await withRetry(async () => {
            // Check if deal exists
            const existingDeal = await prisma.deal.findUnique({ where: { id: dealId } });
            if (!existingDeal) return { success: false, error: "Deal not found" };

            // Calculate values
            const costValue = data.quantity * data.supplierPricePerTon;
            const expectedSalesValue = data.quantity * data.offtakePricePerTon;
            const expectedGrossMargin = expectedSalesValue - costValue;
            const expectedMarginPercentage = expectedSalesValue > 0 ? (expectedGrossMargin / expectedSalesValue) * 100 : 0;

            await prisma.deal.update({
                where: { id: dealId },
                data: {
                    date: data.date,
                    status: data.status,
                    commodityId: data.commodityId,
                    supplierId: data.supplierId,
                    customerId: data.customerId,
                    financierId: data.financierId || null,
                    quantity: data.quantity,
                    supplierPricePerTon: data.supplierPricePerTon,
                    offtakePricePerTon: data.offtakePricePerTon,
                    costValue,
                    expectedSalesValue,
                    expectedGrossMargin,
                    expectedMarginPercentage,
                    paymentTermsCustomer: data.paymentTermsCustomer,
                    paymentTermsFinancier: data.paymentTermsFinancier,
                    dealOwner: data.dealOwner,
                    comments: data.comments,
                }
            });

            revalidatePath("/deals");
            revalidatePath("/receivables");
            return { success: true };
        });
    } catch (error) {
        console.error("Failed to update deal:", error);
        return { success: false, error: "Failed to update deal" };
    }
}
