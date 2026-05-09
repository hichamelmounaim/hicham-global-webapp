import { getPost } from "@/app/actions/posts"
import { Button } from "@/components/ui/button"
import { PostEditor } from "@/components/post-editor"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

interface EditPostPageProps {
    params: Promise<{
        id: string
    }>
}

export default async function EditPostPage({ params }: EditPostPageProps) {
    const { id } = await params
    const post = await getPost(id)

    if (!post) {
        notFound()
    }

    if (!post.parsedContent) {
        return (
            <div className="container mx-auto py-10 max-w-4xl">
                <div className="mb-8">
                    <Link href={`/posts/${post.id}`}>
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Post
                        </Button>
                    </Link>
                </div>
                <div className="text-center py-12">
                    <h2 className="text-2xl font-bold mb-2">No Content to Edit</h2>
                    <p className="text-muted-foreground">This post hasn't been processed yet.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-10 max-w-4xl">
            <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href={`/posts/${post.id}`}>
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Post
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">Edit: {post.keyword}</h1>
                        <p className="text-muted-foreground">Make changes to your generated content</p>
                    </div>
                </div>
            </div>

            <PostEditor post={post} content={post.parsedContent} />
        </div>
    )
}
