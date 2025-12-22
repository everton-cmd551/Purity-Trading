const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const entries = await prisma.cashBook.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5
    });
    console.log('Recent CashBook Entries:', entries.length);
    console.log(JSON.stringify(entries, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
