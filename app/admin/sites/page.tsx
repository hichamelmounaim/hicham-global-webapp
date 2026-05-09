import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { SitesManagerClient } from './SitesManagerClient'
import { Globe } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Site Management | Admin | Hicham Global' }

export default async function AdminSitesPage() {
    const session = await auth()
    if (!session?.user) redirect('/sign-in')
    if (session.user.role !== 'ADMIN') redirect('/')

    const sites = await prisma.site.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            _count: { select: { batches: true, campaigns: true, pillars: true } }
        }
    })

    return (
        <div className="max-w-5xl space-y-8">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                    <Globe className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-black tracking-tight">Site Management</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        {sites.length} WordPress site{sites.length !== 1 ? 's' : ''} connected
                    </p>
                </div>
            </div>

            <SitesManagerClient sites={sites.map(s => ({
                id: s.id,
                name: s.name,
                wpUrl: s.wpUrl,
                wpUser: s.wpUser,
                createdAt: s.createdAt,
                batchCount: s._count.batches,
                campaignCount: s._count.campaigns,
                pillarCount: s._count.pillars,
            }))} />
        </div>
    )
}
