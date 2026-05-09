'use client'

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
    Select, SelectContent, SelectGroup, SelectItem,
    SelectLabel, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { fetchSitePosts, analyzeSubniches, deleteSitePost } from "@/app/actions/sites"
import { Loader2, Globe, Database, FileText, Calendar, ExternalLink, RefreshCw, Sparkles, Trash2, Edit2, MoreVertical } from "lucide-react"

interface FetchArticlesClientProps {
    initialSites: any[]
}

export function FetchArticlesClient({ initialSites }: FetchArticlesClientProps) {
    const [selectedSiteId, setSelectedSiteId] = useState<string>("")
    const [loading, setLoading] = useState(false)
    const [aiLoading, setAiLoading] = useState(false)
    const [aiCategories, setAiCategories] = useState<Record<string, string> | null>(null)
    const [posts, setPosts] = useState<any[]>([])
    const [stats, setStats] = useState<{ total: number; totalPages: number } | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [deletingId, setDeletingId] = useState<number | null>(null)
    const [selectedPosts, setSelectedPosts] = useState<Set<number>>(new Set())
    const [isBulkDeleting, setIsBulkDeleting] = useState(false)

    const togglePostSelection = (postId: number) => {
        setSelectedPosts(prev => {
            const newSet = new Set(prev)
            if (newSet.has(postId)) newSet.delete(postId)
            else newSet.add(postId)
            return newSet
        })
    }

    const toggleAllPosts = (postsInGroup: any[]) => {
        const allSelected = postsInGroup.every(p => selectedPosts.has(p.id))
        setSelectedPosts(prev => {
            const newSet = new Set(prev)
            if (allSelected) {
                postsInGroup.forEach(p => newSet.delete(p.id))
            } else {
                postsInGroup.forEach(p => newSet.add(p.id))
            }
            return newSet
        })
    }

    const handleBulkDelete = async () => {
        if (!selectedSiteId || selectedPosts.size === 0) return
        if (!confirm(`Are you sure you want to delete ${selectedPosts.size} articles from WordPress? This cannot be undone.`)) return

        setIsBulkDeleting(true)
        let successCount = 0
        
        try {
            for (const postId of Array.from(selectedPosts)) {
                const result = await deleteSitePost(selectedSiteId, postId)
                if (result.success) successCount++
            }
            
            setPosts(prev => prev.filter(p => !selectedPosts.has(p.id)))
            if (stats) setStats({ ...stats, total: Math.max(0, stats.total - successCount) })
            setSelectedPosts(new Set())
            
            if (successCount < selectedPosts.size) {
                alert(`Deleted ${successCount} articles, but ${selectedPosts.size - successCount} failed.`)
            }
        } catch (err: any) {
            alert('Bulk delete error: ' + err.message)
        } finally {
            setIsBulkDeleting(false)
        }
    }

    const handleDelete = async (postId: number) => {
        if (!selectedSiteId) return
        if (!confirm('Are you sure you want to delete this article from WordPress?')) return
        
        setDeletingId(postId)
        try {
            const result = await deleteSitePost(selectedSiteId, postId)
            if (result.success) {
                setPosts(prev => prev.filter(p => p.id !== postId))
                if (stats) setStats({ ...stats, total: Math.max(0, stats.total - 1) })
            } else {
                alert('Failed to delete: ' + result.error)
            }
        } catch (err: any) {
            alert('Error: ' + err.message)
        } finally {
            setDeletingId(null)
        }
    }

    const handleFetch = async () => {
        if (!selectedSiteId) return
        
        setLoading(true)
        setError(null)
        setPosts([])
        setStats(null)
        setAiCategories(null)
        setSelectedPosts(new Set())

        try {
            let allPosts: any[] = []
            let page = 1
            let totalPages = 1
            let total = 0
            
            while (page <= totalPages) {
                const result = await fetchSitePosts(selectedSiteId, page, 100)
                if (result.success) {
                    allPosts = [...allPosts, ...result.posts]
                    totalPages = result.totalPages ?? 1
                    total = result.total ?? 0
                    page++
                    // Safety limit to avoid browser crash on massive sites
                    if (allPosts.length >= 1000) break;
                } else {
                    if (page === 1) setError(result.error || null)
                    break;
                }
            }
            
            if (allPosts.length > 0) {
                setPosts(allPosts)
                setStats({ total, totalPages })
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleAIAnalyze = async () => {
        if (posts.length === 0) return
        setAiLoading(true)
        setError(null)
        try {
            const payload = posts.map(p => ({
                id: p.id,
                title: p.title?.rendered || '',
                excerpt: p.excerpt?.rendered?.replace(/<[^>]*>?/gm, '') || ''
            }))
            const result = await analyzeSubniches(payload)
            if (result.success) {
                setAiCategories(result.mapping)
            } else {
                setError(result.error || null)
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setAiLoading(false)
        }
    }

    const selectedSite = initialSites.find(s => s.id === selectedSiteId)

    return (
        <div className="space-y-8">
            {/* Control Panel */}
            <section className="p-8 rounded-[2rem] bg-surface-container-low border border-outline-variant/5 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                    <Database className="h-32 w-32" />
                </div>
                
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <Globe className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="font-black text-lg uppercase tracking-tight font-display">Target Node</h3>
                        <p className="text-xs text-foreground/40 font-medium">Select a connected WordPress site to extract articles from.</p>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-4 max-w-2xl">
                    <div className="w-full">
                        <Select value={selectedSiteId} onValueChange={setSelectedSiteId}>
                            <SelectTrigger className="h-14 bg-surface-container-high border-outline-variant/10 rounded-2xl px-6 font-bold text-sm shadow-sm w-full">
                                <SelectValue placeholder="Select WordPress Site" />
                            </SelectTrigger>
                            <SelectContent className="bg-surface-container-low border-outline-variant/20 rounded-2xl shadow-2xl">
                                <SelectGroup>
                                    <SelectLabel className="text-[10px] font-black uppercase tracking-widest text-primary/60 px-4 py-2">Available Nodes</SelectLabel>
                                    {initialSites.map((site) => (
                                        <SelectItem key={site.id} value={site.id} className="rounded-xl mx-1 my-0.5 hover:bg-surface-container-high transition-colors">
                                            <span className="font-bold">{site.name}</span>
                                            <span className="ml-2 text-[10px] opacity-40 font-medium hidden sm:inline-block">({site.wpUrl})</span>
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
                    
                    <Button 
                        onClick={handleFetch} 
                        disabled={!selectedSiteId || loading}
                        className="h-14 w-full md:w-auto px-8 rounded-2xl bg-primary text-on-primary font-black text-xs uppercase tracking-widest gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                        {loading ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <RefreshCw className="h-4.5 w-4.5" />}
                        Fetch Articles
                    </Button>
                </div>
            </section>

            {/* Error Message */}
            <AnimatePresence>
                {error && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-bold flex items-center justify-center"
                    >
                        {error}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Results */}
            <AnimatePresence>
                {stats && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-12"
                    >
                        <div className="flex items-center justify-between bg-surface-container-low p-6 rounded-[2rem] border border-outline-variant/10 shadow-sm flex-col md:flex-row gap-4">
                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
                                    <Check className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black uppercase tracking-tight font-display">Extraction Complete</h3>
                                    <p className="text-xs text-foreground/50 font-medium">
                                        {aiCategories ? 'Articles split by AI subniches' : 'Articles automatically split by subniches'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                                <Button 
                                    onClick={handleAIAnalyze} 
                                    disabled={aiLoading || posts.length === 0 || selectedPosts.size > 0}
                                    variant="outline"
                                    className={`h-12 px-6 rounded-2xl font-bold text-xs uppercase tracking-widest gap-2 transition-all ${
                                        aiCategories 
                                            ? 'border-green-500/20 text-green-500 bg-green-500/10 hover:bg-green-500/20' 
                                            : 'border-primary/20 text-primary hover:bg-primary/10'
                                    } ${selectedPosts.size > 0 ? 'hidden md:flex opacity-50' : ''}`}
                                >
                                    {aiLoading ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <Sparkles className="h-4.5 w-4.5" />}
                                    {aiCategories ? 'AI Analyzed' : 'AI Analyze Subniches'}
                                </Button>

                                {selectedPosts.size > 0 && (
                                    <Button 
                                        onClick={handleBulkDelete}
                                        disabled={isBulkDeleting}
                                        className="h-12 px-6 rounded-2xl font-bold text-xs uppercase tracking-widest gap-2 bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
                                    >
                                        {isBulkDeleting ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <Trash2 className="h-4.5 w-4.5" />}
                                        Delete Selected ({selectedPosts.size})
                                    </Button>
                                )}

                                <div className="text-right">
                                    <p className="text-xl font-black text-primary">{stats.total}</p>
                                    <p className="text-[10px] text-foreground/40 font-bold uppercase tracking-widest">Total Found</p>
                                </div>
                            </div>
                        </div>

                        {/* Grouped by Subniche */}
                        <div className="space-y-12">
                            {Object.entries(
                                posts.reduce((acc: Record<string, any[]>, post) => {
                                    let subniches: string[] = []
                                    
                                    if (aiCategories && aiCategories[post.id]) {
                                        subniches = [aiCategories[post.id]]
                                    } else {
                                        const terms = post._embedded?.['wp:term']?.flat() || []
                                        const categories = terms.filter((t: any) => t.taxonomy === 'category')
                                        subniches = categories.map((c: any) => c.name)
                                    }
                                    
                                    if (subniches.length === 0) {
                                        if (!acc['Uncategorized']) acc['Uncategorized'] = []
                                        acc['Uncategorized'].push(post)
                                    } else {
                                        subniches.forEach((cat: string) => {
                                            if (!acc[cat]) acc[cat] = []
                                            if (!acc[cat].find(p => p.id === post.id)) {
                                                acc[cat].push(post)
                                            }
                                        })
                                    }
                                    return acc
                                }, {})
                            ).map(([subniche, subnichePosts], groupIndex) => (
                                <motion.div 
                                    key={subniche}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: groupIndex * 0.1 }}
                                    className="space-y-6"
                                >
                                    <div className="flex items-center gap-4">
                                        <h4 className="text-2xl font-black font-display uppercase tracking-tight text-foreground/90">
                                            {subniche}
                                        </h4>
                                        <div className="h-px flex-1 bg-gradient-to-r from-outline-variant/20 to-transparent" />
                                        <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">
                                            {subnichePosts.length} Articles
                                        </span>
                                    </div>

                                    <div className="overflow-x-auto rounded-[2rem] border border-outline-variant/10 shadow-lg bg-surface-container">
                                        <table className="w-full text-left border-collapse min-w-[600px]">
                                            <thead>
                                                <tr className="bg-surface-container-high border-b border-outline-variant/10 text-[10px] font-black uppercase tracking-widest text-primary/60">
                                                    <th className="px-6 py-4 w-12">
                                                        <input 
                                                            type="checkbox" 
                                                            className="w-4 h-4 rounded border-outline-variant/20 bg-background accent-primary cursor-pointer"
                                                            checked={subnichePosts.length > 0 && subnichePosts.every((p: any) => selectedPosts.has(p.id))}
                                                            onChange={() => toggleAllPosts(subnichePosts)}
                                                        />
                                                    </th>
                                                    <th className="px-6 py-4">Article</th>
                                                    <th className="px-6 py-4 w-64">Path</th>
                                                    <th className="px-6 py-4 w-32">Date</th>
                                                    <th className="px-6 py-4 w-48 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-outline-variant/5">
                                                {subnichePosts.map((post: any, i: number) => {
                                                    const date = new Date(post.date).toLocaleDateString()
                                                    const imageUrl = post._embedded?.['wp:featuredmedia']?.[0]?.source_url
                                                    return (
                                                        <motion.tr
                                                            key={post.id}
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: (groupIndex * 0.1) + (i * 0.02) }}
                                                            className="group hover:bg-surface-container-highest transition-colors"
                                                        >
                                                            <td className="px-6 py-4">
                                                                <input 
                                                                    type="checkbox" 
                                                                    className="w-4 h-4 rounded border-outline-variant/20 bg-background accent-primary cursor-pointer"
                                                                    checked={selectedPosts.has(post.id)}
                                                                    onChange={() => togglePostSelection(post.id)}
                                                                />
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-4">
                                                                    {imageUrl ? (
                                                                        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border border-outline-variant/10 shadow-sm">
                                                                            <img src={imageUrl} alt={post.title.rendered} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                                        </div>
                                                                    ) : (
                                                                        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border border-outline-variant/10 shadow-sm bg-surface-container-high flex items-center justify-center text-foreground/10">
                                                                            <FileText className="h-5 w-5" />
                                                                        </div>
                                                                    )}
                                                                    <div className="min-w-0">
                                                                        <h4 
                                                                            className="text-sm font-black leading-tight truncate group-hover:text-primary transition-colors max-w-md"
                                                                            dangerouslySetInnerHTML={{ __html: post.title.rendered }}
                                                                        />
                                                                        <div 
                                                                            className="text-[10px] text-foreground/50 truncate max-w-md mt-1"
                                                                            dangerouslySetInnerHTML={{ __html: post.excerpt.rendered }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center">
                                                                    <code className="text-[10px] px-2 py-1 rounded bg-surface-container-high text-foreground/70 font-mono border border-outline-variant/5 break-all max-w-[250px]">
                                                                        /{post.slug}/
                                                                    </code>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high text-[10px] font-bold tracking-widest text-foreground/60 border border-outline-variant/5">
                                                                    <Calendar className="h-3 w-3" />
                                                                    {date}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                <div className="flex items-center justify-end gap-2">
                                                                    <a 
                                                                        href={post.link} 
                                                                        target="_blank" 
                                                                        rel="noopener noreferrer"
                                                                        className="p-2 rounded-xl bg-surface-container hover:bg-primary/10 text-primary transition-colors border border-outline-variant/5 shadow-sm"
                                                                        title="View live article"
                                                                    >
                                                                        <ExternalLink className="h-4 w-4" />
                                                                    </a>
                                                                    <a 
                                                                        href={`${selectedSite?.wpUrl}/wp-admin/post.php?post=${post.id}&action=edit`}
                                                                        target="_blank" 
                                                                        rel="noopener noreferrer"
                                                                        className="p-2 rounded-xl bg-surface-container hover:bg-primary/10 text-primary transition-colors border border-outline-variant/5 shadow-sm"
                                                                        title="Edit in WordPress"
                                                                    >
                                                                        <Edit2 className="h-4 w-4" />
                                                                    </a>
                                                                    <button 
                                                                        onClick={() => handleDelete(post.id)}
                                                                        disabled={deletingId === post.id}
                                                                        className="p-2 rounded-xl bg-surface-container hover:bg-red-500/10 text-foreground/50 hover:text-red-500 transition-colors disabled:opacity-50 border border-outline-variant/5 shadow-sm"
                                                                        title="Delete from WordPress"
                                                                    >
                                                                        {deletingId === post.id ? <Loader2 className="h-4 w-4 animate-spin text-red-500" /> : <Trash2 className="h-4 w-4" />}
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </motion.tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

function Check(props: any) {
    return (
        <svg
            {...props}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M20 6 9 17l-5-5" />
        </svg>
    )
}
