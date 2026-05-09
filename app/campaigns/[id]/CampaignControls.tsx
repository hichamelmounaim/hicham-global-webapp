'use client'

import { useState, useTransition } from 'react'
import { toggleCampaignStatus, processCampaignRun, deleteCampaign } from '@/app/actions/campaigns'
import { Button } from '@/components/ui/button'
import { Play, Pause, Trash2, Zap, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface CampaignControlsProps {
    id: string
    status: string
}

export function CampaignControls({ id, status }: CampaignControlsProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [runResult, setRunResult] = useState<{ processed: number; errors: number } | null>(null)
    const [isRunning, setIsRunning] = useState(false)
    const [showDelete, setShowDelete] = useState(false)

    function handleToggle() {
        const next = status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'
        startTransition(async () => {
            await toggleCampaignStatus(id, next as any)
            router.refresh()
        })
    }

    async function handleRun() {
        setIsRunning(true)
        setRunResult(null)
        try {
            const result = await processCampaignRun(id)
            setRunResult(result)
        } catch (e: any) {
            setRunResult({ processed: 0, errors: 1 })
        } finally {
            setIsRunning(false)
            router.refresh()
        }
    }

    function handleDelete() {
        startTransition(async () => {
            await deleteCampaign(id)
        })
    }

    return (
        <div className="flex items-center gap-3 flex-wrap">
            {/* Manual Run */}
            <Button
                onClick={handleRun}
                disabled={isRunning || status === 'PAUSED' || status === 'COMPLETED'}
                className="gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold"
            >
                {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                {isRunning ? 'Running...' : 'Run Now'}
            </Button>

            {/* Pause / Resume */}
            {status !== 'COMPLETED' && (
                <Button variant="outline" onClick={handleToggle} disabled={isPending} className="gap-2 font-bold">
                    {status === 'ACTIVE'
                        ? <><Pause className="h-4 w-4" /> Pause</>
                        : <><Play className="h-4 w-4" /> Resume</>}
                </Button>
            )}

            {/* Delete */}
            {!showDelete ? (
                <Button variant="ghost" size="sm" onClick={() => setShowDelete(true)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                    <Trash2 className="h-4 w-4" />
                </Button>
            ) : (
                <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2">
                    <span className="text-xs text-red-400 font-bold">Delete campaign?</span>
                    <Button size="sm" className="h-6 px-2 text-xs bg-red-500 hover:bg-red-400" onClick={handleDelete} disabled={isPending}>
                        Yes
                    </Button>
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => setShowDelete(false)}>
                        No
                    </Button>
                </div>
            )}

            {/* Run result badge */}
            {runResult && (
                <div className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${runResult.errors > 0
                    ? 'bg-red-500/5 border-red-500/20 text-red-400'
                    : 'bg-green-500/5 border-green-500/20 text-green-400'
                    }`}>
                    {runResult.processed > 0
                        ? `✅ ${runResult.processed} processed${runResult.errors > 0 ? `, ${runResult.errors} errors` : ''}`
                        : runResult.errors > 0
                            ? `❌ ${runResult.errors} error(s)`
                            : '⏳ No items due yet'
                    }
                </div>
            )}
        </div>
    )
}
