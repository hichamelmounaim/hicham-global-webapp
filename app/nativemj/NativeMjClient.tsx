'use client'

import { useState, useEffect, useTransition } from "react"
import { NativeMjTask } from "@prisma/client"
import { addNativeMjTask, clearNativeMjQueue, getNativeMjTasks, processNativeMjQueue } from "@/app/actions/nativemj"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Trash2, Send, AlertCircle, CheckCircle, Clock } from "lucide-react"

export function NativeMjClient({ initialTasks, hasConfig }: { initialTasks: NativeMjTask[], hasConfig: boolean }) {
    const [tasks, setTasks] = useState<NativeMjTask[]>(initialTasks)
    const [prompt, setPrompt] = useState("")
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)

    // Poll the server periodically to drive the queue and update tasks
    useEffect(() => {
        if (!hasConfig) return

        const interval = setInterval(async () => {
            setIsProcessing(true)
            await processNativeMjQueue()
            const updated = await getNativeMjTasks()
            setTasks(updated)
            setIsProcessing(false)
        }, 5000)

        return () => clearInterval(interval)
    }, [hasConfig])

    async function handleAdd() {
        if (!prompt.trim()) return
        setError(null)
        startTransition(async () => {
            try {
                await addNativeMjTask(prompt)
                setPrompt("")
                const updated = await getNativeMjTasks()
                setTasks(updated)
            } catch (err: any) {
                setError(err.message)
            }
        })
    }

    async function handleClear() {
        if (!confirm('Are you sure you want to clear the entire queue?')) return
        startTransition(async () => {
            await clearNativeMjQueue()
            setTasks([])
        })
    }

    if (!hasConfig) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-red-500/10 border border-red-500/20 rounded-3xl text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <h3 className="text-xl font-bold text-red-500">Configuration Missing</h3>
                <p className="text-sm text-red-500/80 mt-2 max-w-md">
                    Please configure the NativeMJ Discord User Token, Server ID, and Channel ID in the Settings page to use this feature.
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div className="p-6 bg-surface-container border border-outline-variant/10 rounded-3xl shadow-sm">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="space-y-2 flex-1 w-full">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/60 ml-1">Test Prompt / Add to Queue</Label>
                        <Input 
                            value={prompt} 
                            onChange={(e) => setPrompt(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                            placeholder="A futuristic city cyberpunk neon..."
                            className="h-12 bg-surface-container-high border-outline-variant/10 rounded-2xl px-4 text-sm"
                            disabled={isPending}
                        />
                    </div>
                    <Button onClick={handleAdd} disabled={isPending || !prompt.trim()} className="h-12 px-6 bg-tertiary hover:bg-tertiary/90 text-white rounded-2xl font-bold transition-all shadow-md">
                        {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 mr-2" />} Add Task
                    </Button>
                </div>
                {error && <div className="mt-3 text-sm text-red-500 bg-red-500/10 p-3 rounded-xl">{error}</div>}
            </div>

            <div className="p-6 bg-surface-container border border-outline-variant/10 rounded-3xl shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        Task Queue
                        {isProcessing && <Loader2 className="w-4 h-4 animate-spin text-tertiary" />}
                    </h3>
                    <Button onClick={handleClear} disabled={isPending || tasks.length === 0} variant="outline" size="sm" className="h-9 rounded-xl border-red-500/20 text-red-500 hover:bg-red-500/10">
                        <Trash2 className="w-4 h-4 mr-2" /> Clear Queue
                    </Button>
                </div>

                <div className="space-y-3">
                    {tasks.length === 0 ? (
                        <div className="p-8 text-center text-foreground/40 font-medium bg-surface-container-high/30 rounded-2xl border border-dashed border-outline-variant/20">
                            No tasks in queue. Add a prompt above to get started.
                        </div>
                    ) : (
                        tasks.map((task) => (
                            <div key={task.id} className="p-4 rounded-2xl border border-outline-variant/10 bg-surface-container-highest flex flex-col md:flex-row gap-4 justify-between group">
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center gap-2">
                                        {task.status === 'QUEUED' && <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-foreground/10 text-foreground/70"><Clock size={10}/> QUEUED</span>}
                                        {task.status === 'PROCESSING' && <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 animate-pulse"><Loader2 size={10} className="animate-spin"/> PROCESSING</span>}
                                        {task.status === 'COMPLETED' && <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/10 text-green-500"><CheckCircle size={10}/> COMPLETED</span>}
                                        {task.status === 'FAILED' && <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-500"><AlertCircle size={10}/> FAILED</span>}
                                        <span className="text-[10px] text-foreground/40 font-mono">{new Date(task.createdAt).toLocaleString()}</span>
                                    </div>
                                    <p className="text-sm font-medium text-foreground line-clamp-2">{task.prompt}</p>
                                    {task.error && <p className="text-xs text-red-500 mt-1">{task.error}</p>}
                                </div>
                                {task.imageUrl && (
                                    <div className="w-full md:w-32 aspect-video md:aspect-square relative rounded-xl overflow-hidden bg-black/10 flex-shrink-0">
                                        <img src={task.imageUrl} alt="Result" className="w-full h-full object-cover" />
                                        <a href={task.imageUrl} target="_blank" className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold uppercase tracking-widest backdrop-blur-sm">
                                            View
                                        </a>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
