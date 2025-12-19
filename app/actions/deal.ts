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
};

export async function createDeal(input: CreateDealInput) {
    try {
        // Calculate values
        const costValue = input.quantity * input.supplierPricePerTon;
        const expectedSalesValue = input.quantity * input.offtakePricePerTon;
        const expectedGrossMargin = expectedSalesValue - costValue;
        const expectedMarginPercentage = expectedSalesValue > 0 ? (expectedGrossMargin / expectedSalesValue) * 100 : 0;

        const deal = await prisma.deal.create({
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

        revalidatePath("/deals");
        return { success: true, deal };
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
            financier: true
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
