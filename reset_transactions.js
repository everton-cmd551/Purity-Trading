const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Starting data cleanup...');

    // Delete in order of dependencies (child first, then parent)

    // 1. Cash Book & Payments
    await prisma.cashBook.deleteMany({});
    console.log('Deleted CashBook entries');

    await prisma.customerPayment.deleteMany({});
    console.log('Deleted Customer Payments');

    await prisma.repayment.deleteMany({});
    console.log('Deleted Repayments');

    // 2. Deliveries & Loans (Depend on Deal)
    await prisma.delivery.deleteMany({});
    console.log('Deleted Deliveries');

    await prisma.loan.deleteMany({});
    console.log('Deleted Loans');

    // 3. Deals (Root transaction)
    await prisma.deal.deleteMany({});
    console.log('Deleted Deals');

    console.log('Cleanup complete. Master Data (Customers, Suppliers, Commodities) preserved.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
