import { getPost } from "@/app/actions/posts"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Edit, Trash2, RefreshCw, ExternalLink } from "lucide-react"
import { TestGenerateButton } from "@/components/test-generate-button"
import DOMPurify from "isomorphic-dompurify"

interface PostPageProps {
    params: Promise<{
        id: string
    }>
}

export default async function PostPage({ params }: PostPageProps) {
    const { id } = await params
    const post = await getPost(id)

    if (!post) {
        notFound()
    }

    const content = post.parsedContent

    return (
        <div className="container mx-auto py-10 max-w-4xl">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href={`/projects/${post.batchId}`}>
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Batch
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">{post.keyword}</h1>
                        <p className="text-muted-foreground">
                            Batch: {post.batch.name}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant={post.status === 'DONE' ? 'default' : post.status === 'ERROR' ? 'destructive' : 'secondary'}>
                        {post.status}
                    </Badge>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="mb-6 flex gap-2">
                <Link href={`/posts/${post.id}/edit`}>
                    <Button variant="outline" disabled={!content}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                    </Button>
                </Link>
                <Button variant="outline" disabled>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Re-process
                </Button>
                <Button variant="destructive" disabled>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                </Button>
            </div>

            {/* Content Display */}
            {content ? (
                <div className="space-y-6">
                    {/* Title & Meta */}
                    <Card>
                        <CardHeader>
                            <CardTitle>SEO & Metadata</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h3 className="font-semibold mb-1">Title</h3>
                                <p>{content.title || 'Not generated'}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold mb-1">Slug</h3>
                                <code className="text-sm bg-secondary px-2 py-1 rounded">{content.slug || 'not-generated'}</code>
                            </div>
                            <div>
                                <h3 className="font-semibold mb-1">Meta Description</h3>
                                <p className="text-sm text-muted-foreground">{content.meta_description || 'Not generated'}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold mb-1">Tags</h3>
                                <p className="text-sm">{content.tags || 'Not generated'}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold mb-1">Keywords</h3>
                                <p className="text-sm">{content.keywords || content.key_words || 'Not generated'}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Generated Images */}
                    {(post.featuredImageUrl || post.ingredientsImageUrl || post.finalDishImageUrl) && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Generated Images</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {post.featuredImageUrl && (
                                    <div>
                                        <p className="text-sm font-semibold mb-2">Featured Image</p>
                                        <img src={post.featuredImageUrl} alt="Featured" className="w-full rounded-lg border" />
                                    </div>
                                )}
                                {post.ingredientsImageUrl && (
                                    <div>
                                        <p className="text-sm font-semibold mb-2">Ingredients Prep</p>
                                        <img src={post.ingredientsImageUrl} alt="Ingredients" className="w-full rounded-lg border" />
                                    </div>
                                )}
                                {post.finalDishImageUrl && (
                                    <div>
                                        <p className="text-sm font-semibold mb-2">Final Plated</p>
                                        <img src={post.finalDishImageUrl} alt="Final dish" className="w-full rounded-lg border" />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Recipe Card */}
                    {post.parsedRecipeData && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Recipe Card Data</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Prep Time</p>
                                        <p className="font-semibold">{post.parsedRecipeData.prep_time || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Cook Time</p>
                                        <p className="font-semibold">{post.parsedRecipeData.cook_time || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Total Time</p>
                                        <p className="font-semibold">{post.parsedRecipeData.total_time || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Yield</p>
                                        <p className="font-semibold">{post.parsedRecipeData.yield || 'N/A'}</p>
                                    </div>
                                </div>

                                {post.parsedRecipeData.ingredients && (
                                    <div>
                                        <h3 className="font-semibold mb-2">Ingredients</h3>
                                        <ul className="list-disc list-inside space-y-1 text-sm">
                                            {post.parsedRecipeData.ingredients.map((ing: string, idx: number) => (
                                                <li key={idx}>{ing}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {post.parsedRecipeData.nutrition && (
                                    <div>
                                        <h3 className="font-semibold mb-2">Nutrition (per serving)</h3>
                                        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-sm">
                                            <div><span className="text-muted-foreground">Calories:</span> {post.parsedRecipeData.calories}</div>
                                            <div><span className="text-muted-foreground">Protein:</span> {post.parsedRecipeData.protein}</div>
                                            <div><span className="text-muted-foreground">Carbs:</span> {post.parsedRecipeData.carbohydrates}</div>
                                            <div><span className="text-muted-foreground">Fat:</span> {post.parsedRecipeData.fat}</div>
                                            <div><span className="text-muted-foreground">Fiber:</span> {post.parsedRecipeData.fiber}</div>
                                            <div><span className="text-muted-foreground">Sugar:</span> {post.parsedRecipeData.sugar}</div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Rank Math SEO */}
                    {post.parsedRankMathData && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Rank Math SEO</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <p className="text-sm font-semibold">Focus Keyword</p>
                                    <p className="text-sm">{post.parsedRankMathData.focus_keyword}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold">SEO Title</p>
                                    <p className="text-sm">{post.parsedRankMathData.seo_title}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold">SEO Description</p>
                                    <p className="text-sm text-muted-foreground">{post.parsedRankMathData.seo_description}</p>
                                </div>
                                {post.parsedRankMathData.faq_items && post.parsedRankMathData.faq_items.length > 0 && (
                                    <div>
                                        <p className="text-sm font-semibold mb-2">FAQs ({post.parsedRankMathData.faq_items.length})</p>
                                        <div className="space-y-2">
                                            {post.parsedRankMathData.faq_items.slice(0, 3).map((faq: any, idx: number) => (
                                                <div key={idx} className="text-sm">
                                                    <p className="font-medium">{faq.question}</p>
                                                    <p className="text-muted-foreground">{faq.answer}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Introduction */}
                    {content.intro && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Introduction</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content.intro) }} />
                            </CardContent>
                        </Card>
                    )}

                    {/* Body */}
                    {content.body && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Main Content</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content.body) }} />
                            </CardContent>
                        </Card>
                    )}

                    {/* Conclusion */}
                    {content.conclusion && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Conclusion</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content.conclusion) }} />
                            </CardContent>
                        </Card>
                    )}

                    {/* Images */}
                    {content.image_urls && content.image_urls.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Generated Images</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {content.image_urls.map((url: string, idx: number) => (
                                    <div key={idx}>
                                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline flex items-center gap-2">
                                            <ExternalLink className="h-3 w-3" />
                                            Image {idx + 1}
                                        </a>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* WordPress */}
                    {content.wp_link && (
                        <Card>
                            <CardHeader>
                                <CardTitle>WordPress</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <p className="text-sm">
                                        <span className="font-semibold">Post ID:</span> {content.wp_post_id}
                                    </p>
                                    <a href={content.wp_link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline flex items-center gap-2">
                                        <ExternalLink className="h-4 w-4" />
                                        View on WordPress
                                    </a>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            ) : (
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        No content generated yet. Process this post to generate content.
                    </CardContent>
                </Card>
            )}

            {/* Recent Logs */}
            {post.logs.length > 0 && (
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>Last 10 log entries</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {post.logs.map((log) => (
                                <div key={log.id} className="text-sm flex items-start gap-2">
                                    <Badge variant={log.level === 'ERROR' ? 'destructive' : log.level === 'SUCCESS' ? 'default' : 'secondary'} className="mt-0.5">
                                        {log.level}
                                    </Badge>
                                    <span className="flex-1">{log.message}</span>
                                    <span className="text-muted-foreground text-xs">
                                        {new Date(log.createdAt).toLocaleTimeString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
