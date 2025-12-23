"use server";

import { PrismaClient } from "@prisma/client";

import { db as prisma } from "@/lib/db";

export async function getCashBook() {
    return await prisma.cashBook.findMany({
        orderBy: { date: 'desc' },
        take: 500 // Limit for performance
    });
}
