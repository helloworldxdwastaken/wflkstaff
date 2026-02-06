import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const email = process.env.SEED_ADMIN_EMAIL || 'admin@example.com'
    const password = process.env.SEED_ADMIN_PASSWORD || 'change-me'
    const secureWord = process.env.SEED_ADMIN_SECURE_WORD || 'change-me'

    const passwordHash = await bcrypt.hash(password, 10)
    const secureWordHash = await bcrypt.hash(secureWord, 10)

    const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
            email,
            name: 'Admin User',
            passwordHash,
            secureWordHash,
            role: 'ADMIN',
            timezone: 'America/New_York',
        },
    })

    console.log({ user })
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
