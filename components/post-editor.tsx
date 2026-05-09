'use client'

import { useState, useTransition } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { updatePost } from "@/app/actions/posts"
import { useRouter } from 'next/navigation'
import { PostContent } from '@/lib/types'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface PostEditorProps {
    post: {
        id: string;
        batchId: string;
        expertContent?: string | null;
        personalContent?: string | null;
        socialContent?: string | null;
        parsedSocialContent?: any;
    }
    content: PostContent
}

export function PostEditor({ post, content }: PostEditorProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [formData, setFormData] = useState<PostContent>({
        title: content?.title || '',
        slug: content?.slug || '',
        meta_description: content?.meta_description || '',
        tags: content?.tags || '',
        keywords: content?.keywords || '',
        intro: content?.intro || '',
        body: content?.body || '',
        conclusion: content?.conclusion || '',
        expertContent: post.expertContent || '',
        personalContent: post.personalContent || '',
        socialContent: post.socialContent || ''
    })

    const [socialData, setSocialData] = useState({
        pinterest_title: post.parsedSocialContent?.pinterest?.title || '',
        pinterest_desc: post.parsedSocialContent?.pinterest?.description || '',
        reddit_post: post.parsedSocialContent?.reddit || '',
        youtube_post: post.parsedSocialContent?.youtube || ''
    })

    function handleChange(field: keyof PostContent, value: string) {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    function handleSocialChange(field: string, value: string) {
        setSocialData(prev => ({ ...prev, [field]: value }))
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        startTransition(async () => {
            const updatedContent = {
                ...content,
                ...formData,
                batchId: post.batchId
            }

            const extraFields = {
                expertContent: formData.expertContent,
                personalContent: formData.personalContent,
                socialContent: {
                    pinterest: { title: socialData.pinterest_title, description: socialData.pinterest_desc },
                    reddit: socialData.reddit_post,
                    youtube: socialData.youtube_post
                }
            }

            const result = await updatePost(post.id, updatedContent, extraFields)

            if (result.success) {
                router.push(`/posts/${post.id}`)
                router.refresh()
            } else {
                alert(`Error: ${result.error}`)
            }
        })
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs defaultValue="seo" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="seo">SEO & Meta</TabsTrigger>
                    <TabsTrigger value="article">Article Content</TabsTrigger>
                    <TabsTrigger value="specialized">Specialized Blocks</TabsTrigger>
                    <TabsTrigger value="social">Social Media</TabsTrigger>
                </TabsList>

                <TabsContent value="seo" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>SEO & Metadata</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="title">Title</Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => handleChange('title', e.target.value)}
                                    placeholder="Enter title"
                                />
                            </div>
                            <div>
                                <Label htmlFor="slug">Slug</Label>
                                <Input
                                    id="slug"
                                    value={formData.slug}
                                    onChange={(e) => handleChange('slug', e.target.value)}
                                    placeholder="enter-slug"
                                    className="font-mono"
                                />
                            </div>
                            <div>
                                <Label htmlFor="meta_description">Meta Description</Label>
                                <Textarea
                                    id="meta_description"
                                    value={formData.meta_description}
                                    onChange={(e) => handleChange('meta_description', e.target.value)}
                                    placeholder="Enter meta description"
                                    rows={3}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="article" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Introduction</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                value={formData.intro}
                                onChange={(e) => handleChange('intro', e.target.value)}
                                placeholder="Enter introduction HTML"
                                rows={6}
                                className="font-mono text-sm"
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Main Content</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                value={formData.body}
                                onChange={(e) => handleChange('body', e.target.value)}
                                placeholder="Enter body HTML"
                                rows={12}
                                className="font-mono text-sm"
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Conclusion</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                value={formData.conclusion}
                                onChange={(e) => handleChange('conclusion', e.target.value)}
                                placeholder="Enter conclusion HTML"
                                rows={6}
                                className="font-mono text-sm"
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="specialized" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Expert Says</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                value={formData.expertContent}
                                onChange={(e) => handleChange('expertContent', e.target.value)}
                                placeholder="Expert quote HTML"
                                rows={6}
                                className="font-mono text-sm"
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Personal Touch</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                value={formData.personalContent}
                                onChange={(e) => handleChange('personalContent', e.target.value)}
                                placeholder="Personal anecdote HTML"
                                rows={6}
                                className="font-mono text-sm"
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="social" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Pinterest Content</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>Pinterest Title</Label>
                                <Input
                                    value={socialData.pinterest_title}
                                    onChange={(e) => handleSocialChange('pinterest_title', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label>Pinterest Description</Label>
                                <Textarea
                                    value={socialData.pinterest_desc}
                                    onChange={(e) => handleSocialChange('pinterest_desc', e.target.value)}
                                    rows={3}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Reddit Post</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                value={socialData.reddit_post}
                                onChange={(e) => handleSocialChange('reddit_post', e.target.value)}
                                rows={6}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <Card>
                <CardFooter className="flex justify-between pt-6">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push(`/posts/${post.id}`)}
                        disabled={isPending}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isPending}>
                        {isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    )
}
