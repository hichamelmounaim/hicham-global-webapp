import { getCampaign } from '@/app/actions/campaigns'
import { CampaignControls } from './CampaignControls'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeft, Globe, Clock, Play, Pause, CheckCircle2,
    AlertCircle, ExternalLink, Layers, FileText, Zap, Circle
} from 'lucide-react'

export const dynamic = 'force-dynamic'

const STATUS_ITEM: Record<string, { label: string; icon: React.ElementType; color: string }> = {
    PENDING: { label: 'Pending', icon: Circle, color: 'text-muted-foreground' },
    PROCESSING: { label: 'Processing', icon: Zap, color: 'text-amber-400' },
    DONE: { label: 'Done', icon: CheckCircle2, color: 'text-green-400' },
    ERROR: { label: 'Error', icon: AlertCircle, color: 'text-red-400' },
    SKIPPED: { label: 'Skipped', icon: Pause, color: 'text-muted-foreground/40' },
}

const CAMPAIGN_STATUS: Record<string, { label: string; icon: React.ElementType; color: string }> = {
    ACTIVE: { label: 'Active', icon: Play, color: 'text-green-400 bg-green-400/10 border-green-500/20' },
    PAUSED: { label: 'Paused', icon: Pause, color: 'text-amber-400 bg-amber-400/10 border-amber-500/20' },
    COMPLETED: { label: 'Completed', icon: CheckCircle2, color: 'text-cyan-400 bg-cyan-400/10 border-cyan-500/20' },
    DRAFT: { label: 'Draft', icon: Circle, color: 'text-muted-foreground bg-muted/10 border-border' },
}

export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const campaign = await getCampaign(id)
    if (!campaign) notFound()

    const progress = campaign.totalItems > 0
        ? Math.round((campaign.completedItems / campaign.totalItems) * 100)
        : 0

    const cfg = CAMPAIGN_STATUS[campaign.status] || CAMPAIGN_STATUS.DRAFT
    const CfgIcon = cfg.icon

    const done = campaign.queueItems.filter(i => i.status === 'DONE').length
    const errors = campaign.queueItems.filter(i => i.status === 'ERROR').length
    const processing = campaign.queueItems.filter(i => i.status === 'PROCESSING').length
    const pending = campaign.queueItems.filter(i => i.status === 'PENDING').length

    return (
        <div className="max-w-5xl space-y-8">
            {/* Breadcrumb */}
            <Link href="/campaigns" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group">
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                All Campaigns
            </Link>

            {/* Header */}
            <div className="rounded-2xl border border-border/40 bg-card p-6 space-y-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <div className="flex items-center gap-3 mb-1.5">
                            <h1 className="text-2xl font-black tracking-tight">{campaign.name}</h1>
                            <span className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${cfg.color}`}>
                                <CfgIcon className="h-3 w-3" />
                                {cfg.label}
                            </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                                {campaign.contentType === 'pillar' ? <Layers className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                                {campaign.contentType === 'pillar' ? 'Pillar Articles' : 'Blog Posts'}
                            </span>
                            {campaign.site && (
                                <span className="flex items-center gap-1">
                                    <Globe className="h-3 w-3" /> {campaign.site.name}
                                </span>
                            )}
                            <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" /> Every {campaign.intervalHours}h · {campaign.postsPerRun}/run
                            </span>
                            <span className={`font-bold ${campaign.autoPublish ? 'text-green-400' : 'text-muted-foreground'}`}>
                                {campaign.autoPublish ? '✅ Auto-publish ON' : '⏸ Manual publish'}
                            </span>
                        </div>
                    </div>

                    <CampaignControls id={campaign.id} status={campaign.status} />
                </div>

                {/* Progress */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{campaign.completedItems} / {campaign.totalItems} completed</span>
                        <span className="font-black font-mono text-amber-400">{progress}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="flex gap-4 text-xs">
                        <span className="text-green-400 font-bold">{done} done</span>
                        {processing > 0 && <span className="text-amber-400 font-bold animate-pulse">{processing} running</span>}
                        <span className="text-muted-foreground">{pending} pending</span>
                        {errors > 0 && <span className="text-red-400 font-bold">{errors} errors</span>}
                    </div>
                </div>
            </div>

            {/* Queue Table */}
            <div className="rounded-2xl border border-border/40 bg-card overflow-hidden">
                <div className="p-5 border-b border-border/40">
                    <h2 className="font-black text-sm uppercase tracking-widest text-muted-foreground">
                        Queue ({campaign.queueItems.length} items)
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border/40 bg-muted/20">
                                <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">#</th>
                                <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Keyword</th>
                                <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                                <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Scheduled</th>
                                <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Published</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/20">
                            {campaign.queueItems.map((item, i) => {
                                const s = STATUS_ITEM[item.status] || STATUS_ITEM.PENDING
                                const SIcon = s.icon

                                return (
                                    <tr key={item.id} className="hover:bg-muted/10 transition-colors group">
                                        <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground/40">{i + 1}</td>
                                        <td className="px-5 py-3.5 font-medium">{item.keyword}</td>
                                        <td className="px-5 py-3.5">
                                            <span className={`flex items-center gap-1.5 text-xs font-bold ${s.color}`}>
                                                <SIcon className={`h-3.5 w-3.5 ${item.status === 'PROCESSING' ? 'animate-pulse' : ''}`} />
                                                {s.label}
                                            </span>
                                            {item.error && (
                                                <p className="text-[10px] text-red-400/70 mt-0.5 truncate max-w-[200px]">{item.error}</p>
                                            )}
                                        </td>
                                        <td className="px-5 py-3.5 text-xs text-muted-foreground font-mono">
                                            {item.scheduledAt
                                                ? new Date(item.scheduledAt).toLocaleDateString('en-GB', {
                                                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                                                })
                                                : '—'
                                            }
                                        </td>
                                        <td className="px-5 py-3.5">
                                            {item.wpLink ? (
                                                <a
                                                    href={item.wpLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300 font-medium transition-colors"
                                                >
                                                    View Post <ExternalLink className="h-3 w-3" />
                                                </a>
                                            ) : item.postId ? (
                                                <Link href={`/posts/${item.postId}`} className="text-xs text-cyan-400 hover:text-cyan-300 font-medium">
                                                    View Draft →
                                                </Link>
                                            ) : '—'}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
