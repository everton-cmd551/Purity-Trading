const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const email = 'evertonmusiyiwa@gmail.com';
    const password = 'Musiyiwa2000';
    const name = 'Everton Musiyiwa';

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.upsert({
        where: { email },
        update: {
            password: hashedPassword,
            name,
        },
        create: {
            email,
            name,
            password: hashedPassword,
            role: 'ADMIN', // Assuming admin role, can be adjusted
        },
    });

    console.log({ user });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
