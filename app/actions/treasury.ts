"use server";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getCashBook() {
    return await prisma.cashBook.findMany({
        orderBy: { date: 'desc' },
        take: 500 // Limit for performance
    });
}
