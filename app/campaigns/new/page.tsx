import { prisma } from '@/lib/prisma'
import { NewCampaignForm } from './NewCampaignForm'
import { ArrowLeft, Zap } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
    title: 'New Campaign | Hicham Global',
}

export default async function NewCampaignPage() {
    const sites = await prisma.site.findMany({
        select: { id: true, name: true, wpUrl: true },
        orderBy: { createdAt: 'desc' },
    })

    return (
        <div className="max-w-2xl space-y-8">
            {/* Header */}
            <div>
                <Link href="/campaigns" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 group">
                    <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    All Campaigns
                </Link>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
                        <Zap className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight">New Campaign</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Schedule a drip of auto-generated articles
                        </p>
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-border/40 bg-card p-8">
                <NewCampaignForm sites={sites} />
            </div>
        </div>
    )
}
