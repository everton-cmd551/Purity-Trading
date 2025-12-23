const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const email = 'evertonmusiyiwa@gmail.com';
    const password = 'Musiyiwa2000';

    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        console.log('User NOT found');
        return;
    }

    console.log('User found:', user);

    const isValid = await bcrypt.compare(password, user.password);
    console.log('Password valid:', isValid);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
