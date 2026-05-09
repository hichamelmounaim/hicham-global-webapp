import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

async function seed() {
    const email = 'hicham@admin.com'
    const password = '123456'
    const name = 'Hicham G.'

    const hash = await bcrypt.hash(password, 12)

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
        console.log('✅ Admin already exists:', email)
        await prisma.$disconnect()
        return
    }

    const user = await prisma.user.create({
        data: { email, name, password: hash, role: 'ADMIN' },
    })

    console.log('✅ Admin seeded:', user.email)
    await prisma.$disconnect()
}

seed().catch((e) => { console.error(e); process.exit(1) })
