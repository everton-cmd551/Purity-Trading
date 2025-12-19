"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

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

export async function createDeal(input: CreateDealInput) {
    try {
        // Calculate values
        const costValue = input.quantity * input.supplierPricePerTon;
        const expectedSalesValue = input.quantity * input.offtakePricePerTon;
        const expectedGrossMargin = expectedSalesValue - costValue;
        const expectedMarginPercentage = expectedSalesValue > 0 ? (expectedGrossMargin / expectedSalesValue) * 100 : 0;

        const result = await prisma.$transaction(async (tx) => {
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
                // Calculate maturity date if not passed (though we might want to pass it explicitly to be safe, logic: disbursement + days)
                const maturityDate = new Date(input.disbursementDate);
                maturityDate.setDate(maturityDate.getDate() + input.paymentTermsFinancier);

                await tx.loan.create({
                    data: {
                        dealId: deal.id,
                        principal: costValue, // Assuming loan covers the cost
                        disbursementDate: input.disbursementDate,
                        paymentTerms: input.paymentTermsFinancier,
                        maturityDate: maturityDate,
                        repaymentAmount: input.maturityValue || costValue, // Default to principal if no interest/value provided
                        status: "Open"
                    }
                });
            }

            return deal;
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
}

export async function getMasterDataOptions() {
    const commodities = await prisma.commodity.findMany();
    const suppliers = await prisma.supplier.findMany();
    const customers = await prisma.customer.findMany();
    const financiers = await prisma.financier.findMany();

    return { commodities, suppliers, customers, financiers };
}
