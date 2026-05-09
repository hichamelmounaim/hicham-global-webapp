import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sites = await prisma.site.findMany({
        orderBy: { createdAt: 'asc' },
        select: {
            id: true,
            name: true,
            wpUrl: true,
            isDefault: true,
            createdAt: true,
            updatedAt: true,
        },
    })
    return NextResponse.json({ sites })
}
