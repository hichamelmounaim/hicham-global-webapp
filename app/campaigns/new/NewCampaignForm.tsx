'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createCampaign } from '@/app/actions/campaigns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Zap, FileText, Layers, Globe, Clock, Play, Info } from 'lucide-react'

interface NewCampaignFormProps {
    sites: { id: string; name: string; wpUrl: string }[]
}

export function NewCampaignForm({ sites }: NewCampaignFormProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const [contentType, setContentType] = useState('post')
    const [siteId, setSiteId] = useState(sites[0]?.id || '')
    const [intervalHours, setIntervalHours] = useState('24')
    const [postsPerRun, setPostsPerRun] = useState('1')
    const [autoPublish, setAutoPublish] = useState(true)
    const [keywords, setKeywords] = useState('')
    const kwCount = keywords.split('\n').filter(k => k.trim()).length

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setError(null)
        const form = e.currentTarget
        const fd = new FormData(form)
        fd.set('siteId', siteId)
        fd.set('contentType', contentType)
        fd.set('intervalHours', intervalHours)
        fd.set('postsPerRun', postsPerRun)
        fd.set('autoPublish', String(autoPublish))

        startTransition(async () => {
            try {
                await createCampaign(fd)
            } catch (err: any) {
                if (!err.message?.includes('NEXT_REDIRECT')) {
                    setError(err.message || 'Failed to create campaign')
                }
            }
        })
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400 flex items-center gap-2">
                    <Info className="h-4 w-4 flex-shrink-0" />
                    {error}
                </div>
            )}

            {/* Campaign Name */}
            <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Campaign Name</Label>
                <Input
                    name="name"
                    placeholder="e.g. Summer Recipe Blitz"
                    required
                    className="h-12 rounded-xl bg-card border-border/50 font-medium"
                />
            </div>

            {/* Content Type */}
            <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Content Type</Label>
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { value: 'post', label: 'Blog Posts', desc: 'Full recipe articles with images', icon: FileText },
                        { value: 'pillar', label: 'Pillar Articles', desc: 'Long-form 4000+ word SEO pillars', icon: Layers },
                    ].map(({ value, label, desc, icon: Icon }) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => setContentType(value)}
                            className={`rounded-xl border p-4 text-left transition-all ${contentType === value
                                ? 'border-amber-500/40 bg-amber-500/5 text-foreground'
                                : 'border-border/40 bg-card text-muted-foreground hover:border-border'
                                }`}
                        >
                            <Icon className={`h-5 w-5 mb-2 ${contentType === value ? 'text-amber-400' : ''}`} />
                            <p className="font-black text-sm">{label}</p>
                            <p className="text-xs mt-0.5 opacity-70">{desc}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* WordPress Site */}
            <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                    <Globe className="h-3 w-3" /> WordPress Site
                </Label>
                {sites.length === 0 ? (
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-400">
                        No WordPress sites connected. <a href="/sites/new" className="underline font-bold">Connect one first →</a>
                    </div>
                ) : (
                    <Select value={siteId} onValueChange={setSiteId}>
                        <SelectTrigger className="h-12 rounded-xl bg-card border-border/50">
                            <SelectValue placeholder="Select a site" />
                        </SelectTrigger>
                        <SelectContent>
                            {sites.map(s => (
                                <SelectItem key={s.id} value={s.id}>
                                    {s.name} <span className="text-muted-foreground text-xs ml-1">({s.wpUrl})</span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            </div>

            {/* Schedule */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                        <Clock className="h-3 w-3" /> Interval (hours)
                    </Label>
                    <Select value={intervalHours} onValueChange={setIntervalHours}>
                        <SelectTrigger className="h-12 rounded-xl bg-card border-border/50">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1">Every 1 hour</SelectItem>
                            <SelectItem value="6">Every 6 hours</SelectItem>
                            <SelectItem value="12">Every 12 hours</SelectItem>
                            <SelectItem value="24">Once per day</SelectItem>
                            <SelectItem value="48">Every 2 days</SelectItem>
                            <SelectItem value="72">Every 3 days</SelectItem>
                            <SelectItem value="168">Once per week</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Articles per run</Label>
                    <Select value={postsPerRun} onValueChange={setPostsPerRun}>
                        <SelectTrigger className="h-12 rounded-xl bg-card border-border/50">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1">1 per run</SelectItem>
                            <SelectItem value="2">2 per run</SelectItem>
                            <SelectItem value="3">3 per run</SelectItem>
                            <SelectItem value="5">5 per run</SelectItem>
                            <SelectItem value="10">10 per run</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Auto Publish */}
            <div className="flex items-center justify-between rounded-xl border border-border/40 bg-card p-4">
                <div>
                    <p className="font-bold text-sm">Auto-publish to WordPress</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Push directly to WordPress when generation completes
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setAutoPublish(!autoPublish)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${autoPublish ? 'bg-amber-500' : 'bg-muted'}`}
                >
                    <div className={`w-4.5 h-4.5 w-[18px] h-[18px] rounded-full bg-white shadow absolute top-[3px] transition-transform ${autoPublish ? 'translate-x-[26px]' : 'translate-x-[3px]'}`} />
                </button>
            </div>

            {/* Keywords */}
            <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center justify-between">
                    <span>Keywords (one per line)</span>
                    {kwCount > 0 && (
                        <span className="text-amber-400 font-mono">{kwCount} queued</span>
                    )}
                </Label>
                <textarea
                    name="keywords"
                    value={keywords}
                    onChange={e => setKeywords(e.target.value)}
                    placeholder={"easy chocolate chip cookies\nbest banana bread recipe\nhomemade mac and cheese"}
                    rows={10}
                    required
                    className="w-full rounded-xl bg-card border border-border/50 p-3 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/40 transition-all"
                />
                <p className="text-xs text-muted-foreground">
                    Each keyword becomes one article. Items are scheduled {intervalHours}h apart automatically.
                </p>
            </div>

            {/* Submit */}
            <Button
                type="submit"
                disabled={isPending || sites.length === 0}
                className="w-full h-13 h-[52px] rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-sm tracking-wider gap-2"
            >
                {isPending ? (
                    <><div className="h-4 w-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Creating Campaign...</>
                ) : (
                    <><Play className="h-4 w-4" /> Launch Campaign</>
                )}
            </Button>
        </form>
    )
}
