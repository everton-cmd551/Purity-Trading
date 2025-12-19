const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log('Seeding Master Data...')

    // Seed Commodities
    const commodities = [
        { name: 'White Maize (GMO Free)' },
        { name: 'Yellow Maize' },
        { name: 'Soya Beans' },
        { name: 'Sorghum' },
    ]

    for (const c of commodities) {
        await prisma.commodity.upsert({
            where: { name: c.name },
            update: {},
            create: c,
        })
    }
    console.log('Commodities seeded.')

    // Seed Suppliers
    const suppliers = [
        { name: 'Farm Co-op A', contactDetails: 'John Doe, 555-0101' },
        { name: 'AgriCorp International', contactDetails: 'Jane Smith, 555-0102' },
    ]
    const createdSuppliers = []
    for (const s of suppliers) {
        // Simple create, in pro would check overlap by name if unique constraint existed
        const created = await prisma.supplier.create({ data: s })
        createdSuppliers.push(created)
    }
    console.log('Suppliers seeded.')

    // Seed Customers
    const customers = [
        { name: 'National Foods', contactDetails: 'Procurement Dept' },
        { name: 'Blue Ribbon Foods', contactDetails: 'Buyer B' },
    ]
    for (const c of customers) {
        await prisma.customer.create({ data: c })
    }
    console.log('Customers seeded.')

    // Seed Financiers
    const financiers = [
        { name: 'RAM', fundingTerms: '10% p.a.' },
        { name: 'Redwood', fundingTerms: '12% p.a.' },
        { name: 'Self-Funded', fundingTerms: 'N/A' },
    ]
    for (const f of financiers) {
        await prisma.financier.create({ data: f })
    }
    console.log('Financiers seeded.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
