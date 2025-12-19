import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding Master Data...')

    // 1. Commodities
    // 1. Commodities
    const commodities = [
        { name: 'White Maize (GMO Free)' },
        { name: 'White Maize (GMO)' },
        { name: 'Yellow Maize (GMO Free)' },
        { name: 'SOYA BEANS' },
        { name: 'Wheat' },
        { name: 'Sunflower' }
    ]

    for (const c of commodities) {
        await prisma.commodity.upsert({
            where: { name: c.name },
            update: {},
            create: c,
        })
    }

    // 2. Suppliers
    const suppliers = [
        { name: 'AgriCorp Global', contactDetails: 'procurement@agricorp.com' },
        { name: 'FarmCo Holdings', contactDetails: 'sales@farmco.com' },
        { name: 'Grain Traders Ltd', contactDetails: 'trade@graintraders.com' }
    ]

    for (const s of suppliers) {
        // No unique constraint on name usually, but for seeding let's check first or just create
        // Simple create is fine for now, or check exisitng.
        // For idempotency, we'll FindFirst.
        const exists = await prisma.supplier.findFirst({ where: { name: s.name } })
        if (!exists) {
            await prisma.supplier.create({ data: s })
        }
    }

    // 3. Customers
    const customers = [
        { name: 'National Foods', contactDetails: 'buying@natfoods.co', defaultTerms: '30 Days' },
        { name: 'Mega Market', contactDetails: 'procurement@megamarket.co', defaultTerms: '14 Days' },
        { name: 'Blue Ribbon', contactDetails: 'intake@blueribbon.co', defaultTerms: 'Cash' }
    ]

    for (const c of customers) {
        const exists = await prisma.customer.findFirst({ where: { name: c.name } })
        if (!exists) {
            await prisma.customer.create({ data: c })
        }
    }

    // 4. Financiers
    const financiers = [
        { name: 'RAM', fundingTerms: '12% p.a.' },
        { name: 'Redwood', fundingTerms: '1.5% Monthly' },
        { name: 'Self-Funded', fundingTerms: 'Internal' }
    ]

    for (const f of financiers) {
        const exists = await prisma.financier.findFirst({ where: { name: f.name } })
        if (!exists) {
            await prisma.financier.create({ data: f })
        }
    }

    console.log('Seeding completed.')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
