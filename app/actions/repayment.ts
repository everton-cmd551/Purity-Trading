"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { db as prisma } from "@/lib/db";

export type CreateRepaymentInput = {
    loanId: string; // The ID of the Loan (linked to Deal)
    date: Date;
    method: string; // CASH, NOSTRO, NOSTRO / BANK
    amount: number;
    sourceOfFunding?: string; // Optional reference
};

export async function createRepayment(input: CreateRepaymentInput) {
    try {
        const result = await prisma.$transaction(async (tx) => {
            // 1. Fetch Loan to get Deal context for CashBook
            const loan = await tx.loan.findUnique({
                where: { id: input.loanId },
                include: { deal: { include: { financier: true } } }
            });

            if (!loan) throw new Error("Loan not found");

            // 2. Create Repayment Record
            const repayment = await tx.repayment.create({
                data: {
                    loanId: input.loanId,
                    date: input.date,
                    method: input.method,
                    amount: input.amount,
                }
            });

            // 3. Create CashBook Entry (Outward)
            // Logic: 
            // - If CASH -> cashOut
            // - If NOSTRO or BANK -> bankOut
            const isCash = input.method === "CASH";

            await tx.cashBook.create({
                data: {
                    date: input.date,
                    description: `Loan Repayment to ${loan.deal.financier?.name || 'Financier'} (Ref: ${loan.deal.id})`,
                    category: "Loan Repayment",
                    dealId: loan.deal.id,
                    cashOut: isCash ? input.amount : 0,
                    bankOut: isCash ? 0 : input.amount,
                    // Zero the others
                    cashIn: 0,
                    bankIn: 0
                }
            });

            return repayment;
        });

        revalidatePath("/repayments");
        revalidatePath("/financing");
        revalidatePath("/treasury");

        return { success: true, data: result };
    } catch (error) {
        console.error("Failed to create repayment:", error);
        return { success: false, error: "Failed to create repayment" };
    }
}

export async function getRepaymentData() {
    // We need to list repayments. 
    // The spec says "Repayment to Redwood" tab.
    // Columns: Deal Note, Financier, Source(N/A in DB yet?), Date, Method, Amount.

    // We fetch Repayments joined with Loan -> Deal -> Financier
    const repayments = await prisma.repayment.findMany({
        include: {
            loan: {
                include: {
                    deal: {
                        include: {
                            financier: true
                        }
                    }
                }
            }
        },
        orderBy: { date: 'desc' }
    });

    return repayments.map(r => ({
        id: r.id,
        dealId: r.loan.deal.id,
        financierName: r.loan.deal.financier?.name || '-',
        date: r.date,
        method: r.method,
        amount: Number(r.amount)
    }));
}

export async function getOpenLoans() {
    // For the dropdown to select which Deal/Loan to repay
    // Only show loans that are not fully paid? Or all? Spec says "Deal Note lookup".
    // Let's return all open loans.
    const loans = await prisma.loan.findMany({
        where: {
            // Logic for "Open" status eventually, but for now just fetch all with relations
        },
        include: {
            deal: {
                include: { financier: true }
            },
            repayments: true
        }
    });

    // Filter logic can be here or client side. 
    // Let's just return mapped data
    return loans.map(l => ({
        id: l.id, // Loan ID
        dealId: l.deal.id, // Deal Note Label
        financierName: l.deal.financier?.name || 'Unknown',
        outstandingAmount: Number(l.repaymentAmount) - l.repayments.reduce((s: number, r: any) => s + Number(r.amount), 0) // Roughly
    }));
}

export async function deleteRepayment(id: string) {
    try {
        await prisma.repayment.delete({ where: { id } });

        revalidatePath("/repayments");
        revalidatePath("/financing");
        revalidatePath("/treasury");
        return { success: true };
    } catch (error: any) {
        console.error("Failed to delete repayment:", error);
        return { success: false, error: error.message || "Failed to delete repayment" };
    }
}

export async function updateRepayment(id: string, data: { date: Date; amount: number; method: string }) {
    try {
        await prisma.repayment.update({
            where: { id },
            data: {
                date: data.date,
                amount: data.amount,
                method: data.method
            }
        });

        revalidatePath("/repayments");
        revalidatePath("/financing");
        revalidatePath("/treasury");
        return { success: true };
    } catch (error: any) {
        console.error("Failed to update repayment:", error);
        return { success: false, error: error.message || "Failed to update repayment" };
    }
}
