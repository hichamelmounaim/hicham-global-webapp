'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
    ArrowLeft, Layers, CheckCircle2, AlertCircle, Clock, Play,
    RefreshCw, FileText, ChevronDown, ChevronUp, Copy, Check, Globe
} from 'lucide-react'
import { generatePillarOutline, generatePillarSection, getPillarData, publishPillarArticleToWP } from '@/app/actions/generate-pillar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import DraggableOutline from './DraggableOutline'

type PillarData = Awaited<ReturnType<typeof getPillarData>>
type Section = { index: number; title: string; html: string; wordCount: number }
type OutlineSection = { heading: string; subheadings: string[] }

const STATUS_COLORS: Record<string, string> = {
    DRAFT: 'text-muted-foreground',
    GENERATING: 'text-blue-400',
    DONE: 'text-green-400',
    PUBLISHED: 'text-emerald-400',
    ERROR: 'text-red-400',
}

// Removed SectionCard since it's now handled by DraggableOutline

export default function PillarDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter()
    const [pillarId, setPillarId] = useState<string | null>(null)
    const [pillar, setPillar] = useState<PillarData>(null)
    const [outline, setOutline] = useState<OutlineSection[]>([])
    const [sections, setSections] = useState<Section[]>([])
    const [generatingOutline, setGeneratingOutline] = useState(false)
    const [generatingSections, setGeneratingSections] = useState<Set<number>>(new Set())
    const [generatingAll, setGeneratingAll] = useState(false)
    const [error, setError] = useState('')
    const [sites, setSites] = useState<any[]>([])
    const [selectedSite, setSelectedSite] = useState<string>('')
    const [publishing, setPublishing] = useState(false)

    // Load available sites
    useEffect(() => {
        fetch('/api/sites').then(r => r.json()).then(data => {
            setSites(data.sites || [])
            if (data.sites && data.sites.length > 0) setSelectedSite(data.sites[0].id)
        }).catch(err => console.error("Failed to fetch sites", err))
    }, [])

    // Resolve params
    useEffect(() => {
        params.then((p) => setPillarId(p.id))
    }, [params])

    const refresh = useCallback(async () => {
        if (!pillarId) return
        const data = await getPillarData(pillarId)
        setPillar(data)
        if (data?.outline) setOutline(JSON.parse(data.outline))
        if (data?.sections) setSections(JSON.parse(data.sections))
    }, [pillarId])

    useEffect(() => {
        if (pillarId) refresh()
    }, [pillarId, refresh])

    const handleGenerateOutline = async () => {
        if (!pillarId) return
        setGeneratingOutline(true)
        setError('')
        const res = await generatePillarOutline(pillarId)
        if (!res.success) setError(res.error || 'Failed to generate outline')
        await refresh()
        setGeneratingOutline(false)
    }

    const handleGenerateSection = async (index: number) => {
        if (!pillarId) return
        setGeneratingSections((prev) => new Set(prev).add(index))
        const res = await generatePillarSection(pillarId, index)
        if (!res.success) setError(res.error || `Failed to generate section ${index + 1}`)
        await refresh()
        setGeneratingSections((prev) => { const s = new Set(prev); s.delete(index); return s })
    }

    const handleGenerateAll = async () => {
        if (!pillarId || outline.length === 0) return
        setGeneratingAll(true)
        setError('')
        for (let i = 0; i < outline.length; i++) {
            const alreadyDone = sections.find((s) => s.index === i)
            if (!alreadyDone) {
                await handleGenerateSection(i)
            }
        }
        setGeneratingAll(false)
    }

    const handlePublish = async () => {
        if (!pillarId || !selectedSite) return
        setPublishing(true)
        setError('')
        const res = await publishPillarArticleToWP(pillarId, selectedSite)
        if (!res.success) setError(res.error || 'Failed to publish to WordPress')
        await refresh()
        setPublishing(false)
    }

    const seoData = pillar?.seoData ? (() => { try { return JSON.parse(pillar.seoData) } catch { return null } })() : null

    if (!pillar) {
        return (
            <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
                Loading...
            </div>
        )
    }

    const progress = outline.length > 0 ? Math.round((sections.length / outline.length) * 100) : 0

    return (
        <div className="max-w-4xl space-y-6">
            {/* Header */}
            <div className="flex items-start gap-3">
                <Link href="/pillar" className="mt-1 text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-4 w-4" />
                </Link>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-xl font-bold tracking-tight truncate">{pillar.title}</h1>
                        <span className={`text-xs font-medium ${STATUS_COLORS[pillar.status]}`}>
                            {pillar.status}
                        </span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-0.5">
                        Keyword: <span className="font-mono text-xs">{pillar.keyword}</span>
                        {pillar.wordCount > 0 && (
                            <span className="ml-3 text-green-400 font-mono text-xs">
                                {pillar.wordCount.toLocaleString()} / {pillar.targetWords.toLocaleString()} words
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {error}
                </div>
            )}

            {/* SEO Data */}
            {seoData && (
                <div className="rounded-xl border border-border/50 bg-card p-4 space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">SEO Preview</div>
                    <div className="font-semibold text-blue-400 text-sm">{seoData.seoTitle}</div>
                    <div className="text-xs text-muted-foreground">{seoData.metaDesc}</div>
                </div>
            )}

            {/* Outline + Generate */}
            <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-primary" />
                        <h2 className="font-semibold">Article Outline</h2>
                        {outline.length > 0 && (
                            <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                                {outline.length} sections
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {outline.length === 0 ? (
                            <Button
                                onClick={handleGenerateOutline}
                                disabled={generatingOutline}
                                size="sm"
                                className="gap-2"
                            >
                                {generatingOutline ? (
                                    <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Generating Outline...</>
                                ) : (
                                    <><Play className="h-3.5 w-3.5" /> Generate Outline</>
                                )}
                            </Button>
                        ) : (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleGenerateOutline}
                                    disabled={generatingOutline || generatingAll}
                                    className="gap-2 text-xs"
                                >
                                    <RefreshCw className={`h-3 w-3 ${generatingOutline ? 'animate-spin' : ''}`} />
                                    Regen Outline
                                </Button>
                                {sections.length < outline.length && (
                                    <Button
                                        onClick={handleGenerateAll}
                                        disabled={generatingAll || generatingSections.size > 0}
                                        size="sm"
                                        className="gap-2"
                                    >
                                        {generatingAll ? (
                                            <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Generating...</>
                                        ) : (
                                            <><Play className="h-3.5 w-3.5" /> Generate All Sections</>
                                        )}
                                    </Button>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Progress bar */}
                {outline.length > 0 && (
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-primary to-green-500 rounded-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <span>{sections.length}/{outline.length} sections · {progress}%</span>
                    </div>
                )}

                {/* Publish actions */}
                {progress === 100 && pillar.status !== 'PUBLISHED' && (
                    <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4 space-y-3 mt-4">
                        <h3 className="font-semibold text-blue-400 flex items-center gap-2">
                            <Globe className="h-4 w-4" /> Ready to Publish
                        </h3>
                        <div className="flex items-center gap-3">
                            <Select value={selectedSite} onValueChange={setSelectedSite}>
                                <SelectTrigger className="w-[200px] h-8 bg-background"><SelectValue placeholder="Select site..." /></SelectTrigger>
                                <SelectContent>
                                    {sites.map(s => <SelectItem key={s.id} value={s.id}>{s.name || s.wpUrl}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Button
                                size="sm"
                                className="gap-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 hover:text-blue-300 border border-blue-500/30"
                                onClick={handlePublish}
                                disabled={publishing || !selectedSite}
                            >
                                {publishing ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Publishing...</> : 'Publish to WordPress'}
                            </Button>
                        </div>
                    </div>
                )}

                {pillar.status === 'PUBLISHED' && (
                    <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-4 flex items-center justify-between mt-4">
                        <div className="flex items-center gap-2 text-green-400 font-medium text-sm">
                            <CheckCircle2 className="h-4 w-4" /> Published Successfully!
                        </div>
                        {seoData?.wpLink && (
                            <a href={seoData.wpLink} target="_blank" rel="noreferrer" className="text-sm font-medium bg-green-500/20 text-green-400 px-3 py-1.5 rounded-md hover:bg-green-500/30 transition-colors border border-green-500/20">
                                View Post ↗
                            </a>
                        )}
                    </div>
                )}

                {/* Sections */}
                {outline.length === 0 && pillar.status === 'DRAFT' ? (
                    <div className="rounded-xl border-2 border-dashed border-border/50 p-10 text-center">
                        <Layers className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">Click "Generate Outline" to create your article structure</p>
                    </div>
                ) : (
                    <DraggableOutline
                        pillarId={pillarId!}
                        initialOutline={outline}
                        sections={sections}
                        generatingIndexes={generatingSections}
                        onRegenerate={handleGenerateSection}
                        onOutlineSaved={(newOutline) => {
                            setOutline(newOutline)
                            refresh()
                        }}
                    />
                )}
            </div>

            {/* Activity Log */}
            {pillar.logs && pillar.logs.length > 0 && (
                <div className="rounded-xl border border-border/50 p-4 space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Activity Log</div>
                    {pillar.logs.map((log) => (
                        <div key={log.id} className="flex items-start gap-2 text-xs">
                            <span className={`font-mono flex-shrink-0 ${
                                log.level === 'ERROR' ? 'text-red-400' :
                                log.level === 'SUCCESS' ? 'text-green-400' : 'text-muted-foreground'
                            }`}>
                                [{log.level}]
                            </span>
                            <span className="text-muted-foreground">{log.message}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
