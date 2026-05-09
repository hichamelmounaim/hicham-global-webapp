'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
    clearAllLogs, clearUsageLogs, resetAllErrorPosts, purgeAllContent, deleteAllSites
} from '@/app/actions/admin'
import {
    Trash2, RotateCcw, AlertTriangle, Database, Activity, Zap,
    CheckCircle2, X, Loader2, Clock, Shield, Bomb, Globe
} from 'lucide-react'

interface Props {
    dbInfo: { table: string; count: number; icon: string }[]
    activity: { id: string; message: string; level: string; source: string; keyword: string | null; createdAt: Date }[]
    stats: any
}

export function AdminDashboardClient({ dbInfo, activity, stats }: Props) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
    const [activeAction, setActiveAction] = useState<string | null>(null)

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type })
        setTimeout(() => setToast(null), 4000)
    }

    const runAction = (name: string, action: () => Promise<any>, confirmMsg?: string) => {
        if (confirmMsg && !confirm(confirmMsg)) return
        setActiveAction(name)
        startTransition(async () => {
            try {
                const result = await action()
                showToast(result.message || `${name} completed successfully`)
                router.refresh()
            } catch (err: any) {
                showToast(err.message || 'Operation failed', 'error')
            } finally {
                setActiveAction(null)
            }
        })
    }

    const maintenanceActions = [
        {
            name: 'Reset Error Posts',
            description: `Reset all ${stats.posts.error} error posts back to queue`,
            icon: RotateCcw,
            color: 'amber',
            disabled: stats.posts.error === 0,
            action: () => runAction('Reset Error Posts', resetAllErrorPosts),
        },
        {
            name: 'Clear Activity Logs',
            description: `Delete all ${stats.logs} processing logs`,
            icon: Trash2,
            color: 'blue',
            disabled: stats.logs === 0,
            action: () => runAction('Clear Activity Logs', clearAllLogs, `Delete all ${stats.logs} logs? This cannot be undone.`),
        },
        {
            name: 'Clear Usage Analytics',
            description: `Delete all ${stats.usageLogs} usage tracking records`,
            icon: Activity,
            color: 'violet',
            disabled: stats.usageLogs === 0,
            action: () => runAction('Clear Usage Analytics', clearUsageLogs, `Delete all ${stats.usageLogs} usage logs? Analytics data will be lost.`),
        },
        {
            name: 'Remove All Sites',
            description: `Delete all ${stats.sites} WordPress site connections`,
            icon: Globe,
            color: 'indigo',
            disabled: stats.sites === 0,
            action: () => runAction('Remove All Sites', deleteAllSites, `Remove all ${stats.sites} WordPress sites? Content will be unlinked.`),
        },
    ]

    const LEVEL_COLORS: Record<string, string> = {
        INFO: 'text-blue-400',
        SUCCESS: 'text-green-400',
        WARN: 'text-yellow-400',
        ERROR: 'text-red-400',
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
                    <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100">
                        <X className="h-3 w-3" />
                    </button>
                </div>
            )}

            <div className="grid gap-8 lg:grid-cols-12">
                {/* Left: Maintenance + Database */}
                <div className="lg:col-span-7 space-y-8">
                    {/* Maintenance Tools */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-violet-500 rounded-full" />
                            <h2 className="text-lg font-black uppercase tracking-tight">Maintenance Tools</h2>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            {maintenanceActions.map((a) => {
                                const loading = activeAction === a.name && isPending
                                return (
                                    <button
                                        key={a.name}
                                        onClick={a.action}
                                        disabled={a.disabled || isPending}
                                        className={`text-left p-4 rounded-2xl border border-border/40 bg-card hover:bg-muted/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed group`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`p-2 rounded-xl bg-${a.color}-500/10 text-${a.color}-400 group-hover:bg-${a.color}-500/20 transition-colors`}>
                                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <a.icon className="h-4 w-4" />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold">{a.name}</p>
                                                <p className="text-[11px] text-muted-foreground mt-0.5">{a.description}</p>
                                            </div>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>

                        {/* Danger Zone */}
                        <div className="rounded-2xl border-2 border-red-500/20 bg-red-500/[0.02] p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <Bomb className="h-4 w-4 text-red-400" />
                                <h3 className="text-xs font-black uppercase tracking-widest text-red-400">Danger Zone</h3>
                            </div>
                            <p className="text-[11px] text-muted-foreground mb-4">
                                This will permanently delete ALL posts, pillars, batches, campaigns, queue items, and logs. Users and sites will be preserved.
                            </p>
                            <button
                                onClick={() => runAction('Purge All Content', purgeAllContent,
                                    '⚠️ DANGER: This will permanently delete ALL content, campaigns, and logs.\n\nUsers and WordPress sites will be kept.\n\nType "yes" to think carefully - are you SURE?'
                                )}
                                disabled={isPending}
                                className="flex items-center gap-2 h-9 px-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-bold hover:bg-red-500/20 transition-all disabled:opacity-40"
                            >
                                {activeAction === 'Purge All Content' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                                Purge All Content
                            </button>
                        </div>
                    </div>

                    {/* Database Tables */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-cyan-500 rounded-full" />
                            <h2 className="text-lg font-black uppercase tracking-tight">Database Tables</h2>
                        </div>

                        <div className="rounded-2xl border border-border/40 bg-card overflow-hidden">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border/30 bg-muted/20">
                                        <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Table</th>
                                        <th className="text-right px-5 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Records</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/20">
                                    {dbInfo.map(row => (
                                        <tr key={row.table} className="hover:bg-muted/10 transition-colors">
                                            <td className="px-5 py-3 font-medium">
                                                <span className="mr-2">{row.icon}</span>
                                                {row.table}
                                            </td>
                                            <td className="px-5 py-3 text-right font-mono font-bold text-muted-foreground">
                                                {row.count.toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t border-border/30 bg-muted/10">
                                        <td className="px-5 py-3 font-black text-xs uppercase tracking-wider">
                                            <Database className="h-3.5 w-3.5 inline mr-2 text-cyan-400" />
                                            Total Records
                                        </td>
                                        <td className="px-5 py-3 text-right font-mono font-black text-primary">
                                            {dbInfo.reduce((s, r) => s + r.count, 0).toLocaleString()}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right: Activity Feed */}
                <div className="lg:col-span-5">
                    <div className="space-y-4 sticky top-4">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
                            <h2 className="text-lg font-black uppercase tracking-tight">Activity Feed</h2>
                        </div>

                        <div className="rounded-2xl border border-border/40 bg-card overflow-hidden">
                            <div className="max-h-[600px] overflow-y-auto">
                                {activity.length === 0 ? (
                                    <div className="p-10 text-center text-muted-foreground text-sm">
                                        <Clock className="h-8 w-8 mx-auto mb-3 opacity-30" />
                                        No activity yet
                                    </div>
                                ) : (
                                    <div className="divide-y divide-border/10">
                                        {activity.map(log => (
                                            <div key={log.id} className="px-4 py-3 hover:bg-muted/10 transition-colors">
                                                <div className="flex items-start gap-3">
                                                    <div className={`mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${log.level === 'ERROR' ? 'bg-red-400' :
                                                        log.level === 'SUCCESS' ? 'bg-green-400' :
                                                            log.level === 'WARN' ? 'bg-yellow-400' : 'bg-blue-400'
                                                        }`} />
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xs font-medium text-foreground/80 truncate">{log.message}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            {log.keyword && (
                                                                <span className="text-[10px] font-bold text-primary/60 bg-primary/5 px-1.5 py-0.5 rounded">{log.keyword}</span>
                                                            )}
                                                            <span className="text-[10px] text-muted-foreground">
                                                                {new Date(log.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                            <span className={`text-[9px] font-black uppercase ${LEVEL_COLORS[log.level] || 'text-muted-foreground'}`}>
                                                                {log.level}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
