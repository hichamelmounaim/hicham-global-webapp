'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"

export async function getPost(id: string) {
    const post = await prisma.post.findUnique({
        where: { id },
        include: {
            batch: true,
            logs: {
                orderBy: { createdAt: 'desc' },
                take: 10
            }
        }
    })

    if (!post) return null

    // Parse content JSON
    let parsedContent: any = null;
    if (post.content) {
        try {
            parsedContent = JSON.parse(post.content)
        } catch (e) {
            parsedContent = null
        }
    }

    // Parse recipe data
    let parsedRecipeData: any = null;
    if (post.recipeData) {
        try {
            parsedRecipeData = JSON.parse(post.recipeData)
        } catch (e) {
            parsedRecipeData = null
        }
    }

    // Parse Rank Math data
    let parsedRankMathData: any = null;
    if (post.rankMathData) {
        try {
            parsedRankMathData = JSON.parse(post.rankMathData)
        } catch (e) {
            parsedRankMathData = null
        }
    }

    // Parse social content
    let parsedSocialContent: any = null;
    if (post.socialContent) {
        try {
            parsedSocialContent = JSON.parse(post.socialContent)
        } catch (e) {
            parsedSocialContent = null
        }
    }

    return {
        ...post,
        parsedContent,
        parsedRecipeData,
        parsedRankMathData,
        parsedSocialContent
    }
}

export async function updatePost(id: string, content: any, extraFields?: { expertContent?: string, personalContent?: string, socialContent?: any }) {
    const session = await auth()
    if (!session?.user) throw new Error('Not authenticated')
    try {
        await prisma.post.update({
            where: { id },
            data: {
                content: JSON.stringify(content),
                expertContent: extraFields?.expertContent,
                personalContent: extraFields?.personalContent,
                socialContent: extraFields?.socialContent ? JSON.stringify(extraFields.socialContent) : undefined,
                updatedAt: new Date()
            }
        })

        revalidatePath(`/posts/${id}`)
        revalidatePath(`/projects/${content.batchId}`)

        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function deletePost(id: string, batchId: string) {
    const session = await auth()
    if (!session?.user) throw new Error('Not authenticated')
    try {
        // Delete associated logs first
        await prisma.log.deleteMany({
            where: { postId: id }
        })

        // Delete the post
        await prisma.post.delete({
            where: { id }
        })

        revalidatePath(`/projects/${batchId}`)

        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function reprocessPost(id: string) {
    const session = await auth()
    if (!session?.user) throw new Error('Not authenticated')
    try {
        await prisma.post.update({
            where: { id },
            data: {
                status: 'QUEUED',
                step: 0,
                updatedAt: new Date()
            }
        })

        revalidatePath(`/posts/${id}`)

        return { success: true, message: 'Post queued for reprocessing' }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function updateRecipeData(id: string, recipeData: any) {
    try {
        await prisma.post.update({
            where: { id },
            data: {
                recipeData: JSON.stringify(recipeData),
                updatedAt: new Date()
            }
        })

        revalidatePath(`/posts/${id}`)
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function updateImages(id: string, featuredUrl?: string, ingredientsUrl?: string, finalDishUrl?: string) {
    try {
        await prisma.post.update({
            where: { id },
            data: {
                featuredImageUrl: featuredUrl,
                ingredientsImageUrl: ingredientsUrl,
                finalDishImageUrl: finalDishUrl,
                updatedAt: new Date()
            }
        })

        revalidatePath(`/posts/${id}`)
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function updateRankMathData(id: string, rankMathData: any) {
    try {
        await prisma.post.update({
            where: { id },
            data: {
                rankMathData: JSON.stringify(rankMathData),
                updatedAt: new Date()
            }
        })

        revalidatePath(`/posts/${id}`)
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

// ─── Retry All Failed Posts ────────────────────────────────────────────────
export async function retryAllFailed() {
    const session = await auth()
    if (!session?.user) throw new Error('Not authenticated')
    try {
        const result = await prisma.post.updateMany({
            where: { status: 'ERROR' },
            data: { status: 'QUEUED', step: 0, updatedAt: new Date() }
        })

        revalidatePath('/posts')
        revalidatePath('/projects')
        return { success: true, count: result.count, message: `${result.count} failed post(s) queued for retry` }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

// ─── Bulk Delete Posts ─────────────────────────────────────────────────────
export async function bulkDeletePosts(ids: string[]) {
    const session = await auth()
    if (!session?.user) throw new Error('Not authenticated')
    if (!ids?.length) return { success: false, error: 'No posts selected' }

    try {
        // Delete logs first
        await prisma.log.deleteMany({ where: { postId: { in: ids } } })
        // Delete posts
        const result = await prisma.post.deleteMany({ where: { id: { in: ids } } })

        revalidatePath('/posts')
        revalidatePath('/projects')
        return { success: true, count: result.count, message: `${result.count} post(s) deleted` }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

// ─── Bulk Reprocess Posts ──────────────────────────────────────────────────
export async function bulkReprocess(ids: string[]) {
    const session = await auth()
    if (!session?.user) throw new Error('Not authenticated')
    if (!ids?.length) return { success: false, error: 'No posts selected' }

    try {
        const result = await prisma.post.updateMany({
            where: { id: { in: ids } },
            data: { status: 'QUEUED', step: 0, updatedAt: new Date() }
        })

        revalidatePath('/posts')
        revalidatePath('/projects')
        return { success: true, count: result.count, message: `${result.count} post(s) queued for reprocessing` }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

// ─── Export Posts as CSV ────────────────────────────────────────────────────
export async function exportPostsCSV() {
    const session = await auth()
    if (!session?.user) throw new Error('Not authenticated')

    const posts = await prisma.post.findMany({
        include: { batch: { include: { site: true } } },
        orderBy: { createdAt: 'desc' }
    })

    const headers = ['ID', 'Keyword', 'Title', 'Status', 'Site', 'Batch', 'Cost ($)', 'Tokens', 'Created']
    const rows = posts.map(p => {
        let title = p.keyword
        try { title = JSON.parse(p.content || '{}')?.title || p.keyword } catch {}
        return [
            p.id,
            `"${p.keyword.replace(/"/g, '""')}"`,
            `"${title.replace(/"/g, '""')}"`,
            p.status,
            p.batch?.site?.name || '—',
            p.batch?.name || '—',
            p.costUsd.toFixed(4),
            p.promptTokens + p.completionTokens,
            new Date(p.createdAt).toISOString()
        ].join(',')
    })

    return [headers.join(','), ...rows].join('\n')
}
