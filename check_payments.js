const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const payments = await prisma.customerPayment.findMany({
        include: {
            delivery: true
        }
    });
    console.log('Total Payments:', payments.length);
    console.log(JSON.stringify(payments, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
