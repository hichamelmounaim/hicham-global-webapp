import { getCampaigns } from '@/app/actions/campaigns'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, Zap, Play, Pause, CheckCircle2, Clock, AlertCircle, Globe, BarChart2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = {
    title: 'Campaigns | Hicham Global',
    description: 'Manage your drip-publishing campaigns.',
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    ACTIVE: { label: 'Active', color: 'text-green-400 bg-green-400/10 border-green-400/20', icon: Play },
    PAUSED: { label: 'Paused', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20', icon: Pause },
    COMPLETED: { label: 'Completed', color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20', icon: CheckCircle2 },
    DRAFT: { label: 'Draft', color: 'text-muted-foreground bg-muted/10 border-border', icon: Clock },
}

export default async function CampaignsPage() {
    const campaigns = await getCampaigns()

    return (
        <div className="max-w-5xl space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
                        <Zap className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight">Campaigns</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Drip-publish content automatically on your schedule
                        </p>
                    </div>
                </div>
                <Link href="/campaigns/new">
                    <Button className="gap-2 h-11 px-6 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-black">
                        <Plus className="h-4 w-4" />
                        New Campaign
                    </Button>
                </Link>
            </div>

            {/* Cron Info */}
            <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 flex items-start gap-3">
                <BarChart2 className="h-4 w-4 text-violet-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-violet-300/80">
                    <span className="font-bold text-violet-300">Auto-trigger:</span> Point any external cron scheduler to{' '}
                    <code className="bg-violet-500/10 px-1.5 py-0.5 rounded font-mono text-violet-200">GET /api/cron</code>
                    {' '}to automatically process your queues. Run it manually from each campaign page.
                </div>
            </div>

            {/* Campaign Grid */}
            {campaigns.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-border/40 py-24 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-amber-500/10 mx-auto flex items-center justify-center mb-4">
                        <Zap className="h-8 w-8 text-amber-400/40" />
                    </div>
                    <h3 className="text-lg font-black mb-2">No campaigns yet</h3>
                    <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
                        Create a campaign with a list of keywords and let the engine publish them automatically.
                    </p>
                    <Link href="/campaigns/new">
                        <Button variant="outline" className="gap-2">
                            <Plus className="h-4 w-4" /> Create First Campaign
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="grid gap-4">
                    {campaigns.map((campaign) => {
                        const cfg = STATUS_CONFIG[campaign.status] || STATUS_CONFIG.DRAFT
                        const Icon = cfg.icon
                        const progress = campaign.totalItems > 0
                            ? Math.round((campaign.completedItems / campaign.totalItems) * 100)
                            : 0

                        return (
                            <Link key={campaign.id} href={`/campaigns/${campaign.id}`}>
                                <div className="group rounded-2xl border border-border/40 bg-card hover:border-amber-500/30 hover:bg-amber-500/[0.02] transition-all p-6 cursor-pointer">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h2 className="font-black text-lg truncate group-hover:text-amber-400 transition-colors">
                                                    {campaign.name}
                                                </h2>
                                                <span className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${cfg.color}`}>
                                                    <Icon className="h-3 w-3" />
                                                    {cfg.label}
                                                </span>
                                            </div>

                                            {campaign.site && (
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                                                    <Globe className="h-3 w-3" />
                                                    <span className="font-medium">{campaign.site.name}</span>
                                                    <span className="text-muted-foreground/40">·</span>
                                                    <span className="font-mono text-[10px]">{campaign.site.wpUrl}</span>
                                                </div>
                                            )}

                                            {/* Progress bar */}
                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-muted-foreground">
                                                        {campaign.completedItems} / {campaign.totalItems} published
                                                    </span>
                                                    <span className="font-mono font-bold text-amber-400">{progress}%</span>
                                                </div>
                                                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all"
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-right flex-shrink-0">
                                            <div className="text-2xl font-black text-amber-400">{campaign.totalItems}</div>
                                            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">keywords</div>
                                            <div className="text-[10px] text-muted-foreground mt-2">
                                                Every {campaign.intervalHours}h · {campaign.postsPerRun}/run
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
