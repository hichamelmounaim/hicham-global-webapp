import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { PlusCircle, Search, Filter } from "lucide-react"
import { PostsTable } from "@/components/PostsTable"

export default async function PostsPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; status?: string; page?: string }>
}) {
    const params = await searchParams
    const query = params.q || ""
    const statusFilter = params.status || ""
    const page = parseInt(params.page || "1")
    const perPage = 15

    const where: any = {}
    if (query) {
        where.keyword = { contains: query, mode: "insensitive" }
    }
    if (statusFilter) {
        where.status = statusFilter
    }

    const [posts, total, errorCount] = await Promise.all([
        prisma.post.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * perPage,
            take: perPage,
            include: { batch: { include: { site: true } } },
        }),
        prisma.post.count({ where }),
        prisma.post.count({ where: { status: 'ERROR' } }),
    ])

    const totalPages = Math.ceil(total / perPage)

    return (
        <div className="space-y-6 max-w-6xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Articles</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">Manage your generated blog articles</p>
                </div>
                <Link href="/projects/new">
                    <Button size="sm" className="gap-2">
                        <PlusCircle className="h-4 w-4" />
                        New Batch
                    </Button>
                </Link>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
                <form method="GET" className="flex-1 flex gap-3">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <input
                            name="q"
                            defaultValue={query}
                            placeholder="Search articles..."
                            className="w-full pl-9 pr-4 py-2 text-sm bg-muted/40 border border-border/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <select
                            name="status"
                            defaultValue={statusFilter}
                            className="text-sm bg-muted/40 border border-border/50 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary/50 text-muted-foreground"
                        >
                            <option value="">All Status</option>
                            <option value="QUEUED">Queued</option>
                            <option value="PROCESSING">Processing</option>
                            <option value="DONE">Done</option>
                            <option value="ERROR">Error</option>
                        </select>
                        <Button type="submit" variant="outline" size="sm">
                            <Filter className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </form>
            </div>

            {/* Interactive Table with Bulk Actions */}
            <PostsTable
                posts={posts.map(p => ({
                    ...p,
                    batch: p.batch ? {
                        name: p.batch.name,
                        site: p.batch.site ? { name: p.batch.site.name, wpUrl: p.batch.site.wpUrl } : null
                    } : null
                }))}
                errorCount={errorCount}
            />

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} of {total} results</span>
                    <div className="flex items-center gap-2">
                        {page > 1 && (
                            <Link href={`/posts?q=${query}&status=${statusFilter}&page=${page - 1}`}>
                                <Button variant="outline" size="sm">←</Button>
                            </Link>
                        )}
                        <span>Page {page} of {totalPages}</span>
                        {page < totalPages && (
                            <Link href={`/posts?q=${query}&status=${statusFilter}&page=${page + 1}`}>
                                <Button variant="outline" size="sm">→</Button>
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
