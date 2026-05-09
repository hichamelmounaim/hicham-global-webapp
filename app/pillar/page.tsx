import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { PlusCircle, FileText, Clock, CheckCircle2, AlertCircle, Layers } from "lucide-react"

const STATUS_COLORS: Record<string, string> = {
    DRAFT: "bg-muted/50 text-muted-foreground border-border/50",
    GENERATING: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    DONE: "bg-green-500/10 text-green-400 border-green-500/20",
    ERROR: "bg-red-500/10 text-red-400 border-red-500/20",
}

const STATUS_ICONS: Record<string, any> = {
    DRAFT: FileText,
    GENERATING: Clock,
    DONE: CheckCircle2,
    ERROR: AlertCircle,
}

export default async function PillarPage() {
    const pillars = await prisma.pillarArticle.findMany({
        orderBy: { createdAt: "desc" },
        include: { site: true },
    })

    return (
        <div className="space-y-6 max-w-5xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Pillar Articles</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Long-form comprehensive guides (3,000–5,000+ words) built section by section
                    </p>
                </div>
                <Link href="/pillar/new">
                    <Button size="sm" className="gap-2">
                        <PlusCircle className="h-4 w-4" />
                        New Pillar Article
                    </Button>
                </Link>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-4 gap-4">
                {[
                    { label: "Total", value: pillars.length, color: "text-foreground" },
                    { label: "Draft", value: pillars.filter((p) => p.status === "DRAFT").length, color: "text-muted-foreground" },
                    { label: "Generating", value: pillars.filter((p) => p.status === "GENERATING").length, color: "text-blue-400" },
                    { label: "Done", value: pillars.filter((p) => p.status === "DONE").length, color: "text-green-400" },
                ].map((stat) => (
                    <div key={stat.label} className="rounded-xl border border-border/50 bg-card p-4">
                        <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
                        <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* List */}
            {pillars.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-border/50 p-16 text-center">
                    <Layers className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="font-medium text-muted-foreground">No pillar articles yet</p>
                    <p className="text-sm text-muted-foreground/60 mt-1 mb-4">
                        Create comprehensive long-form guides that rank for competitive keywords
                    </p>
                    <Link href="/pillar/new">
                        <Button variant="outline" size="sm" className="gap-2">
                            <PlusCircle className="h-4 w-4" />
                            Create First Pillar Article
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="rounded-xl border border-border/50 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border/50 bg-muted/30">
                                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Title / Keyword</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Words</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Site</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Created</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            {pillars.map((pillar) => {
                                const Icon = STATUS_ICONS[pillar.status] || FileText
                                return (
                                    <tr key={pillar.id} className="hover:bg-muted/20 transition-colors">
                                        <td className="px-4 py-3">
                                            <Link href={`/pillar/${pillar.id}`} className="font-medium hover:text-primary transition-colors">
                                                {pillar.title}
                                            </Link>
                                            <div className="text-xs text-muted-foreground mt-0.5">{pillar.keyword}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[pillar.status]}`}>
                                                <Icon className="h-3 w-3" />
                                                {pillar.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {pillar.wordCount > 0 ? (
                                                <span className="font-mono text-xs">{pillar.wordCount.toLocaleString()} / {pillar.targetWords.toLocaleString()}</span>
                                            ) : "—"}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-muted-foreground">
                                            {pillar.site?.name || "—"}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-muted-foreground">
                                            {new Date(pillar.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
