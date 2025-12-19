"use server";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getFinancingRegister() {
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
}
