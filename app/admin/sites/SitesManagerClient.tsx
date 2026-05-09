'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteSite, testSiteConnection } from '@/app/actions/sites'
import { Trash2, Wifi, WifiOff, Loader2, CheckCircle2, X, AlertTriangle, ExternalLink, FileText, Zap, Layers, Globe } from 'lucide-react'

interface Site {
    id: string
    name: string
    wpUrl: string
    wpUser: string
    createdAt: Date
    batchCount: number
    campaignCount: number
    pillarCount: number
}

export function SitesManagerClient({ sites }: { sites: Site[] }) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [testResults, setTestResults] = useState<Record<string, 'success' | 'error' | 'testing'>>({})
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type })
        setTimeout(() => setToast(null), 4000)
    }

    const handleTest = (siteId: string) => {
        setTestResults(prev => ({ ...prev, [siteId]: 'testing' }))
        startTransition(async () => {
            try {
                const result = await testSiteConnection(siteId)
                setTestResults(prev => ({ ...prev, [siteId]: result.success ? 'success' : 'error' }))
                showToast(result.success ? 'Connection successful!' : (result.error || 'Connection failed'), result.success ? 'success' : 'error')
            } catch {
                setTestResults(prev => ({ ...prev, [siteId]: 'error' }))
                showToast('Connection test failed', 'error')
            }
        })
    }

    const handleDelete = (site: Site) => {
        if (!confirm(`Delete site "${site.name}"?\n\nThis will disconnect:\n- ${site.batchCount} batch(es)\n- ${site.campaignCount} campaign(s)\n- ${site.pillarCount} pillar article(s)`)) return
        startTransition(async () => {
            try {
                await deleteSite(site.id)
                showToast(`Site "${site.name}" deleted`)
                router.refresh()
            } catch (err: any) {
                showToast(err.message || 'Delete failed', 'error')
            }
        })
    }

    return (
        <>
            {/* Toast */}
            {toast && (
                <div className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-xl text-sm font-bold animate-in slide-in-from-top-2 duration-300 ${toast.type === 'success'
                    ? 'bg-green-500/10 border-green-500/20 text-green-400'
                    : 'bg-red-500/10 border-red-500/20 text-red-400'
                    }`}>
                    {toast.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                    {toast.message}
                    <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100"><X className="h-3 w-3" /></button>
                </div>
            )}

            {sites.length === 0 ? (
                <div className="rounded-2xl border border-border/40 bg-card p-16 text-center">
                    <Globe className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                    <p className="text-muted-foreground">No WordPress sites connected yet.</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Add a site from the Sites page to get started.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {sites.map(site => {
                        const testState = testResults[site.id]
                        return (
                            <div key={site.id} className="rounded-2xl border border-border/40 bg-card p-5 hover:bg-muted/10 transition-all">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                                                <Globe className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-sm">{site.name}</h3>
                                                <a href={site.wpUrl} target="_blank" className="text-[11px] text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
                                                    {site.wpUrl} <ExternalLink className="h-2.5 w-2.5" />
                                                </a>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 mt-3 pl-[52px]">
                                            <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                                                <FileText className="h-3 w-3 text-blue-400" /> {site.batchCount} batches
                                            </span>
                                            <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                                                <Zap className="h-3 w-3 text-amber-400" /> {site.campaignCount} campaigns
                                            </span>
                                            <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                                                <Layers className="h-3 w-3 text-cyan-400" /> {site.pillarCount} pillars
                                            </span>
                                            <span className="text-[10px] text-muted-foreground/60">
                                                User: {site.wpUser}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 ml-4">
                                        <button
                                            onClick={() => handleTest(site.id)}
                                            disabled={isPending}
                                            className={`flex items-center gap-1.5 h-8 px-3 rounded-lg border text-xs font-bold transition-all disabled:opacity-40 ${testState === 'success'
                                                ? 'border-green-500/30 text-green-400 bg-green-500/10'
                                                : testState === 'error'
                                                    ? 'border-red-500/30 text-red-400 bg-red-500/10'
                                                    : 'border-border/40 text-muted-foreground hover:text-foreground hover:border-indigo-500/40'
                                                }`}
                                        >
                                            {testState === 'testing'
                                                ? <Loader2 className="h-3 w-3 animate-spin" />
                                                : testState === 'success'
                                                    ? <Wifi className="h-3 w-3" />
                                                    : testState === 'error'
                                                        ? <WifiOff className="h-3 w-3" />
                                                        : <Wifi className="h-3 w-3" />
                                            }
                                            Test
                                        </button>
                                        <button
                                            onClick={() => handleDelete(site)}
                                            disabled={isPending}
                                            className="h-8 w-8 flex items-center justify-center rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-40"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </>
    )
}
