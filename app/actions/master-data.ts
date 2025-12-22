"use server";

import { revalidatePath } from "next/cache";
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

export type CreateCommodityInput = {
    name: string;
}

export async function createCommodity(input: CreateCommodityInput) {
    try {
        const result = await withRetry(async () => {
            return await prisma.commodity.create({
                data: {
                    name: input.name,
                }
            });
        });

        revalidatePath("/master-data");
        revalidatePath("/deals");
        return { success: true, data: result };
    } catch (error: any) {
        console.error("Failed to create commodity:", error);
        return { success: false, error: "Failed to create commodity" };
    }
}

export type CreateSupplierInput = {
    name: string;
    contactDetails?: string;
}

export async function createSupplier(input: CreateSupplierInput) {
    try {
        const result = await withRetry(async () => {
            return await prisma.supplier.create({
                data: {
                    name: input.name,
                    contactDetails: input.contactDetails,
                }
            });
        });

        revalidatePath("/master-data");
        revalidatePath("/deals");
        return { success: true, data: result };
    } catch (error: any) {
        console.error("Failed to create supplier:", error);
        return { success: false, error: "Failed to create supplier" };
    }
}

export type CreateCustomerInput = {
    name: string;
    contactDetails?: string;
    defaultTerms?: string;
}

export async function createCustomer(input: CreateCustomerInput) {
    try {
        const result = await withRetry(async () => {
            return await prisma.customer.create({
                data: {
                    name: input.name,
                    contactDetails: input.contactDetails,
                    defaultTerms: input.defaultTerms,
                }
            });
        });

        revalidatePath("/master-data");
        revalidatePath("/deals");
        return { success: true, data: result };
    } catch (error: any) {
        console.error("Failed to create customer:", error);
        return { success: false, error: "Failed to create customer" };
    }
}

export type CreateFinancierInput = {
    name: string;
    fundingTerms?: string;
}

export async function createFinancier(input: CreateFinancierInput) {
    try {
        const result = await withRetry(async () => {
            return await prisma.financier.create({
                data: {
                    name: input.name,
                    fundingTerms: input.fundingTerms,
                }
            });
        });

        revalidatePath("/master-data");
        revalidatePath("/deals");
        return { success: true, data: result };
    } catch (error: any) {
        console.error("Failed to create financier:", error);
        return { success: false, error: "Failed to create financier" };
    }
}
