'use client'

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
    PlusCircle,
    ArrowRight,
    Trash2,
    Clock,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Calendar,
    Layers
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { deleteBatch } from "@/app/actions/batch"

interface Batch {
    id: string
    name: string
    createdAt: Date
    _count: {
        posts: number
    }
    posts: {
        status: string
    }[]
}

interface ProjectsListProps {
    batches: Batch[]
}

export function ProjectsList({ batches: initialBatches }: ProjectsListProps) {
    const [batches, setBatches] = useState(initialBatches)
    const [isPending, startTransition] = useTransition()
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const router = useRouter()

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this project? This will permanently remove all associated posts and logs.")) {
            return
        }

        setDeletingId(id)
        startTransition(async () => {
            const result = await deleteBatch(id)
            if (result.success) {
                setBatches(batches.filter(b => b.id !== id))
                router.refresh()
            } else {
                alert(`Error deleting project: ${result.error}`)
            }
            setDeletingId(null)
        })
    }

    const getStatusStats = (posts: { status: string }[]) => {
        const total = posts.length
        const completed = posts.filter(p => p.status === 'DONE').length
        const processing = posts.filter(p => p.status === 'PROCESSING').length
        const queued = posts.filter(p => p.status === 'QUEUED').length
        const error = posts.filter(p => p.status === 'ERROR').length

        if (total === 0) return { label: 'Empty', variant: 'outline' as const }
        if (completed === total) return { label: 'Completed', variant: 'success' as const }
        if (error > 0) return { label: `${error} Errors`, variant: 'destructive' as const }
        if (processing > 0) return { label: 'Processing', variant: 'warning' as const }
        return { label: 'In Queue', variant: 'secondary' as const }
    }

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {batches.map((batch) => {
                const stats = getStatusStats(batch.posts)
                const isCurrentlyDeleting = deletingId === batch.id

                return (
                    <Card key={batch.id} className="group relative hover:border-primary/50 transition-all duration-300 hover:shadow-lg overflow-hidden flex flex-col">
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary/10 group-hover:bg-primary transition-colors" />

                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-xl font-bold line-clamp-1">{batch.name}</CardTitle>
                                        <Badge variant={stats.variant}>{stats.label}</Badge>
                                    </div>
                                    <CardDescription className="flex items-center gap-1.5">
                                        <Calendar className="h-3.5 w-3.5" />
                                        {new Date(batch.createdAt).toLocaleDateString(undefined, {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
                                    </CardDescription>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 -mt-2 -mr-2"
                                    onClick={() => handleDelete(batch.id)}
                                    disabled={isCurrentlyDeleting}
                                >
                                    {isCurrentlyDeleting ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </CardHeader>

                        <CardContent className="flex-1">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total Keywords</p>
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-primary/5 rounded">
                                            <Layers className="h-4 w-4 text-primary" />
                                        </div>
                                        <span className="text-lg font-bold">{batch._count.posts}</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Progress</p>
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-green-500/10 rounded">
                                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        </div>
                                        <span className="text-lg font-bold">
                                            {Math.round((batch.posts.filter(p => p.status === 'DONE').length / (batch._count.posts || 1)) * 100)}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>

                        <CardFooter className="pt-0">
                            <Link href={`/projects/${batch.id}`} className="w-full">
                                <Button className="w-full gap-2 group/btn" variant="outline">
                                    View Project Details
                                    <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                                </Button>
                            </Link>
                        </CardFooter>
                    </Card>
                )
            })}

            {batches.length === 0 && (
                <div className="col-span-full border-2 border-dashed rounded-xl py-20 bg-muted/30 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="p-4 bg-background rounded-full shadow-sm">
                        <PlusCircle className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-xl font-semibold">No Projects Yet</h3>
                        <p className="text-muted-foreground max-w-sm mx-auto">
                            You haven't created any content generation batches yet. Create your first one to start automating your workflow.
                        </p>
                    </div>
                    <Link href="/projects/new">
                        <Button className="gap-2">
                            <PlusCircle className="h-4 w-4" />
                            New Batch
                        </Button>
                    </Link>
                </div>
            )}
        </div>
    )
}
