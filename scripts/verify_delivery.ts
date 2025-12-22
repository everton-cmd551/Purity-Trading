
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Verifying Delivery Recording...');

    // 1. Get a Deal (or create one if none exists)
    let deal = await prisma.deal.findFirst({
        where: { status: 'Open' },
        include: { commodity: true, customer: true }
    });

    if (!deal) {
        console.log('No open deal found. Creating a test deal...');
        // Need IDs for master data
        const commodity = await prisma.commodity.findFirst();
        const supplier = await prisma.supplier.findFirst();
        const customer = await prisma.customer.findFirst();

        if (!commodity || !supplier || !customer) {
            throw new Error("Master data missing. Please run seed.");
        }

        deal = await prisma.deal.create({
            data: {
                id: "TEST-DEAL-001",
                date: new Date(),
                commodityId: commodity.id,
                supplierId: supplier.id,
                customerId: customer.id,
                quantity: 100,
                supplierPricePerTon: 200,
                offtakePricePerTon: 250,
                costValue: 20000,
                expectedSalesValue: 25000,
                expectedGrossMargin: 5000,
                expectedMarginPercentage: 20,
                status: "Open"
            },
            include: { commodity: true, customer: true }
        });
    }

    console.log(`Using Deal: ${deal.id}`);

    // 2. Record a Delivery manually (simulating the server action logic)
    const deliveryDate = new Date();
    const quantity = 10;
    const invoiceNumber = "INV-TEST-001";

    // Logic from server action
    const invoiceAmount = Number(deal.offtakePricePerTon) * quantity;

    console.log(`Recording delivery: Qty ${quantity}, Inv ${invoiceNumber}, Amt ${invoiceAmount}`);

    const delivery = await prisma.delivery.create({
        data: {
            dealId: deal.id,
            date: deliveryDate,
            quantity: quantity,
            invoiceNumber: invoiceNumber,
            invoiceAmount: invoiceAmount,
            status: "Unpaid"
        }
    });

    console.log('Delivery recorded:', delivery);

    // 3. Verify it exists
    const fetchedDelivery = await prisma.delivery.findUnique({
        where: { id: delivery.id }
    });

    if (fetchedDelivery) {
        console.log('SUCCESS: Delivery verified in database.');
    } else {
        console.error('FAILURE: Delivery not found.');
    }
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
