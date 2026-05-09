'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Layers, Plus, X, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { createPillarArticle } from '@/app/actions/generate-pillar'

export default function NewPillarPage() {
    const router = useRouter()
    const [isCreating, setIsCreating] = useState(false)
    const [subtopic, setSubtopic] = useState('')
    const [subtopics, setSubtopics] = useState<string[]>([])

    const addSubtopic = () => {
        if (subtopic.trim() && !subtopics.includes(subtopic.trim())) {
            setSubtopics([...subtopics, subtopic.trim()])
            setSubtopic('')
        }
    }

    const removeSubtopic = (idx: number) => {
        setSubtopics(subtopics.filter((_, i) => i !== idx))
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsCreating(true)
        const fd = new FormData(e.currentTarget)
        fd.set('subtopics', JSON.stringify(subtopics))
        const result = await createPillarArticle(fd)
        if (result.success && result.id) {
            router.push(`/pillar/${result.id}`)
        } else {
            alert(result.error || 'Failed to create pillar article')
            setIsCreating(false)
        }
    }

    return (
        <div className="max-w-2xl space-y-6">
            <div className="flex items-center gap-3">
                <Link href="/pillar" className="text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">New Pillar Article</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">Creates a comprehensive long-form guide, section by section</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 bg-card border border-border/50 rounded-xl p-6">
                <div className="space-y-2">
                    <Label htmlFor="keyword">Main Keyword / Topic *</Label>
                    <Input
                        id="keyword"
                        name="keyword"
                        required
                        placeholder="e.g. how to make sourdough bread"
                        className="bg-background"
                    />
                    <p className="text-xs text-muted-foreground">The primary keyword this article will target for SEO</p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="title">Article Title (optional)</Label>
                    <Input
                        id="title"
                        name="title"
                        placeholder="Leave blank to auto-generate from keyword"
                        className="bg-background"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="targetWords">Target Word Count</Label>
                    <select
                        id="targetWords"
                        name="targetWords"
                        defaultValue="4000"
                        className="w-full text-sm bg-background border border-input rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary/50"
                    >
                        <option value="2500">~2,500 words (Medium)</option>
                        <option value="4000">~4,000 words (Long)</option>
                        <option value="6000">~6,000 words (Comprehensive)</option>
                        <option value="8000">~8,000 words (Ultimate Guide)</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="competitorUrl">Competitor URL to Beat <span className="text-muted-foreground font-normal">(The Unfair Advantage)</span></Label>
                    <Input
                        id="competitorUrl"
                        name="competitorUrl"
                        type="url"
                        placeholder="https://competitor.com/their-article"
                        className="bg-background border-primary/20 focus-visible:ring-primary/50"
                    />
                    <p className="text-xs text-muted-foreground">Optional: Provide the top-ranking competitor URL. We will scrape it and generate a comprehensively better outline.</p>
                </div>

                <div className="space-y-2">
                    <Label>Subtopics / Sections to Include</Label>
                    <div className="flex gap-2">
                        <Input
                            value={subtopic}
                            onChange={(e) => setSubtopic(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSubtopic() } }}
                            placeholder="e.g. choosing the right flour"
                            className="bg-background"
                        />
                        <Button type="button" variant="outline" size="sm" onClick={addSubtopic} className="flex-shrink-0">
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Press Enter or + to add. Leave empty to auto-generate subtopics from keyword.</p>
                    {subtopics.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {subtopics.map((s, i) => (
                                <span
                                    key={i}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-primary/10 text-primary border border-primary/20"
                                >
                                    {s}
                                    <button type="button" onClick={() => removeSubtopic(i)}>
                                        <X className="h-3 w-3 hover:text-red-400 transition-colors" />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Info box */}
                <div className="rounded-lg bg-blue-500/5 border border-blue-500/20 p-4 text-sm text-blue-400 space-y-1">
                    <div className="font-semibold flex items-center gap-2">
                        <Layers className="h-4 w-4" />
                        Section-by-Section Generation
                    </div>
                    <p className="text-xs text-blue-400/70">
                        After creating, we'll first generate an outline, then build each section individually with full content.
                        You can pause, resume, or regenerate individual sections at any time.
                    </p>
                </div>

                <div className="flex gap-3 pt-2">
                    <Button type="submit" disabled={isCreating} className="gap-2">
                        {isCreating ? (
                            <>Creating...</>
                        ) : (
                            <><Layers className="h-4 w-4" /> Create Pillar Article</>
                        )}
                    </Button>
                    <Link href="/pillar">
                        <Button type="button" variant="outline">Cancel</Button>
                    </Link>
                </div>
            </form>
        </div>
    )
}
