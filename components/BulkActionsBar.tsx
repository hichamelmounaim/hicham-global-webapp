'use client'

import { useState, useTransition } from 'react'
import { retryAllFailed, bulkDeletePosts, bulkReprocess, exportPostsCSV } from '@/app/actions/posts'
import { RefreshCw, Trash2, Download, RotateCcw, AlertTriangle, CheckCircle2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BulkActionsBarProps {
    selectedIds: string[]
    errorCount: number
    onClear: () => void
}

export function BulkActionsBar({ selectedIds, errorCount, onClear }: BulkActionsBarProps) {
    const [isPending, startTransition] = useTransition()
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type })
        setTimeout(() => setToast(null), 4000)
    }

    const handleRetryAll = () => {
        startTransition(async () => {
            const result = await retryAllFailed()
            if (result.success) showToast(result.message!)
            else showToast(result.error || 'Failed', 'error')
        })
    }

    const handleBulkDelete = () => {
        if (!confirm(`Delete ${selectedIds.length} selected post(s)? This cannot be undone.`)) return
        startTransition(async () => {
            const result = await bulkDeletePosts(selectedIds)
            if (result.success) {
                showToast(result.message!)
                onClear()
            } else showToast(result.error || 'Failed', 'error')
        })
    }

    const handleBulkReprocess = () => {
        startTransition(async () => {
            const result = await bulkReprocess(selectedIds)
            if (result.success) {
                showToast(result.message!)
                onClear()
            } else showToast(result.error || 'Failed', 'error')
        })
    }

    const handleExport = () => {
        startTransition(async () => {
            try {
                const csv = await exportPostsCSV()
                const blob = new Blob([csv], { type: 'text/csv' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `hicham-global-posts-${new Date().toISOString().slice(0, 10)}.csv`
                a.click()
                URL.revokeObjectURL(url)
                showToast('CSV exported successfully')
            } catch {
                showToast('Export failed', 'error')
            }
        })
    }

    return (
        <>
            {/* Toast Notification */}
            {toast && (
                <div className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-xl text-sm font-bold animate-in slide-in-from-top-2 duration-300 ${
                    toast.type === 'success' 
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

            {/* Actions Bar */}
            <div className="flex items-center gap-2 flex-wrap">
                {/* Retry All Failed */}
                {errorCount > 0 && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRetryAll}
                        disabled={isPending}
                        className="gap-2 border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                    >
                        <RotateCcw className={`h-3.5 w-3.5 ${isPending ? 'animate-spin' : ''}`} />
                        Retry {errorCount} Failed
                    </Button>
                )}

                {/* Export CSV */}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExport}
                    disabled={isPending}
                    className="gap-2"
                >
                    <Download className="h-3.5 w-3.5" />
                    Export CSV
                </Button>

                {/* Bulk Selection Actions */}
                {selectedIds.length > 0 && (
                    <>
                        <div className="h-5 w-px bg-border/50 mx-1" />
                        <span className="text-xs text-primary font-bold px-2 py-1 bg-primary/10 rounded-lg border border-primary/20">
                            {selectedIds.length} selected
                        </span>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleBulkReprocess}
                            disabled={isPending}
                            className="gap-2 border-blue-500/20 text-blue-400 hover:bg-blue-500/10"
                        >
                            <RefreshCw className={`h-3.5 w-3.5 ${isPending ? 'animate-spin' : ''}`} />
                            Reprocess
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleBulkDelete}
                            disabled={isPending}
                            className="gap-2 border-red-500/20 text-red-400 hover:bg-red-500/10"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClear}
                            className="text-xs text-muted-foreground"
                        >
                            Clear
                        </Button>
                    </>
                )}
            </div>
        </>
    )
}
