import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { ArrowLeft } from "lucide-react"
import { BatchProcessor } from "@/components/batch-processor"

interface ProjectPageProps {
    params: Promise<{
        id: string
    }>
}

export default async function ProjectPage({ params }: ProjectPageProps) {
    const { id } = await params
    const batch = await prisma.batch.findUnique({
        where: { id },
        include: {
            posts: {
                orderBy: { createdAt: "asc" },
            },
        },
    })

    if (!batch) {
        notFound()
    }

    return (
        <div className="space-y-8 container mx-auto py-10">
            <div className="flex items-center gap-4">
                <Link href="/projects">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{batch.name}</h1>
                    <p className="text-muted-foreground mt-1">
                        Created on {new Date(batch.createdAt).toLocaleString()}
                    </p>
                </div>
                <div className="ml-auto flex gap-2">
                    <BatchProcessor batchId={batch.id} posts={batch.posts} />
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Posts ({batch.posts.length})</CardTitle>
                    <CardDescription>
                        Status of all keywords in this batch.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Keyword</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Step</TableHead>
                                <TableHead className="text-right">Updated</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {batch.posts.map((post) => (
                                <TableRow key={post.id}>
                                    <TableCell className="font-medium">
                                        <Link href={`/posts/${post.id}`} className="hover:underline">
                                            {post.keyword}
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                post.status === "DONE"
                                                    ? "success"
                                                    : post.status === "ERROR"
                                                        ? "destructive"
                                                        : post.status === "QUEUED"
                                                            ? "secondary"
                                                            : "default"
                                            }
                                        >
                                            {post.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="w-full bg-secondary rounded-full h-2.5 max-w-[100px]">
                                            {/* 4 steps total: Title->1, Content->2, Images->3, Publish->4(Done) */}
                                            <div
                                                className="bg-primary h-2.5 rounded-full transition-all duration-500"
                                                style={{ width: `${(post.step / 4) * 100}%` }}
                                            ></div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right text-muted-foreground">
                                        {new Date(post.updatedAt).toLocaleTimeString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Link href={`/posts/${post.id}`}>
                                                <Button variant="ghost" size="sm">
                                                    View
                                                </Button>
                                            </Link>
                                            <Link href={`/posts/${post.id}/edit`}>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    disabled={!post.content}
                                                >
                                                    Edit
                                                </Button>
                                            </Link>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Logs Section - could be a separate component */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Logs</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="bg-slate-950 text-slate-50 p-4 rounded-md font-mono text-sm h-[200px] overflow-y-auto">
                        {/* We would need to fetch logs here or use a server component */}
                        <p className="opacity-50 text-center py-10">Logs will appear here in real-time (implement polling or socket later)</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
