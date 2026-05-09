import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { ProjectsList } from "@/components/projects-list"

export default async function ProjectsPage() {
    const batches = await prisma.batch.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            _count: {
                select: { posts: true },
            },
            posts: {
                select: {
                    status: true
                }
            }
        },
    })

    return (
        <div className="space-y-8 container mx-auto py-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight">Projects</h1>
                    <p className="text-muted-foreground mt-2 text-lg">
                        Manage and monitor your content generation batches.
                    </p>
                </div>
                <Link href="/projects/new">
                    <Button size="lg" className="gap-2 shadow-lg hover:shadow-primary/20 transition-all">
                        <PlusCircle className="h-5 w-5" />
                        New Batch
                    </Button>
                </Link>
            </div>

            <ProjectsList batches={batches} />
        </div>
    )
}
