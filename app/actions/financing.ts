"use server";

import { PrismaClient } from "@prisma/client";
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

export async function getFinancingRegister() {
    try {
        return await withRetry(async () => {
            const loans = await prisma.loan.findMany({
                include: {
                    deal: {
                        include: {
                            financier: true
                        }
                    },
                    repayments: true
                },
                orderBy: { disbursementDate: 'desc' }
            });

            return loans.map(loan => {
                // Calculate Repayments
                const totalRepaid = loan.repayments.reduce((sum, r) => sum + Number(r.amount), 0);

                // Calculate Outstanding
                // Formula: Outstanding = Maturity Value - Repayment Amount
                const maturityValue = Number(loan.repaymentAmount); // Confirmed mapping: repaymentAmount is Maturity Value
                const outstandingBalance = maturityValue - totalRepaid;

                // Calculate Status
                const status = outstandingBalance <= 0.01 ? "Closed" : "Open"; // Tolerance for float

                // Calculate Days Overdue
                const today = new Date();
                const maturityDate = new Date(loan.maturityDate);
                let daysOverdue = 0;

                if (outstandingBalance > 0.01 && today > maturityDate) {
                    const diffTime = Math.abs(today.getTime() - maturityDate.getTime());
                    daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                }

                return {
                    id: loan.id,
                    dealId: loan.deal.id,
                    financierName: loan.deal.financier?.name || 'Unknown',
                    disbursementDate: loan.disbursementDate,
                    principal: Number(loan.principal),
                    maturityDate: loan.maturityDate,
                    paymentTerms: loan.paymentTerms,
                    maturityValue: maturityValue,
                    repaidAmount: totalRepaid,
                    outstandingBalance: outstandingBalance,
                    daysOverdue: daysOverdue,
                    status: status
                };
            });
        });
    } catch (error) {
        console.error("Failed to fetch financing register:", error);
        return [];
    }
}

export async function deleteLoan(id: string) {
    try {
        await prisma.repayment.deleteMany({ where: { loanId: id } });
        await prisma.loan.delete({ where: { id } });

        revalidatePath("/financing");
        revalidatePath("/repayments");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete loan:", error);
        return { success: false, error: "Failed to delete loan" };
    }
}

export async function updateLoan(id: string, data: { disbursementDate: Date; principal: number; maturityDate: Date; repaymentAmount: number }) {
    try {
        await prisma.loan.update({
            where: { id },
            data: {
                disbursementDate: data.disbursementDate,
                principal: data.principal,
                maturityDate: data.maturityDate,
                repaymentAmount: data.repaymentAmount
            }
        });
        revalidatePath("/financing");
        return { success: true };
    } catch (error) {
        console.error("Failed to update loan:", error);
        return { success: false, error: "Failed to update loan" };
    }
}

