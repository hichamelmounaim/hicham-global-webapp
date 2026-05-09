'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

// ─── Create Campaign ────────────────────────────────────────────────────────
export async function createCampaign(formData: FormData) {
    const session = await auth()
    if (!session?.user) throw new Error('Not authenticated')
    const name = formData.get('name') as string
    const keywordsRaw = formData.get('keywords') as string
    const siteId = formData.get('siteId') as string
    const postsPerRun = parseInt(formData.get('postsPerRun') as string) || 1
    const intervalHours = parseInt(formData.get('intervalHours') as string) || 24
    const autoPublish = formData.get('autoPublish') === 'true'
    const contentType = (formData.get('contentType') as string) || 'post'

    if (!name?.trim()) throw new Error('Campaign name is required')
    if (!keywordsRaw?.trim()) throw new Error('At least one keyword is required')
    if (!siteId) throw new Error('Please select a WordPress site')

    const keywords = keywordsRaw
        .split('\n')
        .map((k) => k.trim())
        .filter((k) => k.length > 0)

    if (keywords.length === 0) throw new Error('No valid keywords found')

    // Schedule items: spread by intervalHours
    const now = new Date()
    const queueItems = keywords.map((kw, i) => ({
        keyword: kw,
        status: 'PENDING',
        scheduledAt: new Date(now.getTime() + i * intervalHours * 3600 * 1000),
    }))

    const campaign = await prisma.campaign.create({
        data: {
            name: name.trim(),
            keywords: JSON.stringify(keywords),
            siteId,
            postsPerRun,
            intervalHours,
            autoPublish,
            contentType,
            totalItems: keywords.length,
            completedItems: 0,
            status: 'ACTIVE',
            queueItems: { create: queueItems },
        },
    })

    revalidatePath('/campaigns')
    redirect(`/campaigns/${campaign.id}`)
}

// ─── Get all campaigns ─────────────────────────────────────────────────────
export async function getCampaigns() {
    return prisma.campaign.findMany({
        include: {
            site: { select: { name: true, wpUrl: true } },
            _count: { select: { queueItems: true } },
        },
        orderBy: { createdAt: 'desc' },
    })
}

// ─── Get single campaign with queue ────────────────────────────────────────
export async function getCampaign(id: string) {
    return prisma.campaign.findUnique({
        where: { id },
        include: {
            site: { select: { name: true, wpUrl: true } },
            queueItems: { orderBy: { scheduledAt: 'asc' } },
        },
    })
}

// ─── Toggle campaign status ─────────────────────────────────────────────────
export async function toggleCampaignStatus(id: string, newStatus: 'ACTIVE' | 'PAUSED') {
    const session = await auth()
    if (!session?.user) throw new Error('Not authenticated')
    await prisma.campaign.update({ where: { id }, data: { status: newStatus } })
    revalidatePath('/campaigns')
    revalidatePath(`/campaigns/${id}`)
}

// ─── Delete campaign ────────────────────────────────────────────────────────
export async function deleteCampaign(id: string) {
    const session = await auth()
    if (!session?.user) throw new Error('Not authenticated')
    await prisma.campaign.delete({ where: { id } })
    revalidatePath('/campaigns')
    redirect('/campaigns')
}

// ─── Process the next N pending items (called by CRON or manually) ───────────
export async function processCampaignRun(campaignId: string): Promise<{ processed: number; errors: number }> {
    const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        include: { site: true },
    })

    if (!campaign || campaign.status !== 'ACTIVE') return { processed: 0, errors: 0 }

    const settings = await prisma.settings.findFirst()
    if (!settings?.openRouterKey) throw new Error('OpenRouter API key not configured')

    // Pick up to postsPerRun items that are due
    const now = new Date()
    const pendingItems = await prisma.queueItem.findMany({
        where: {
            campaignId,
            status: 'PENDING',
            scheduledAt: { lte: now },
        },
        take: campaign.postsPerRun,
        orderBy: { scheduledAt: 'asc' },
    })

    let processed = 0
    let errors = 0

    for (const item of pendingItems) {
        // Mark as processing
        await prisma.queueItem.update({ where: { id: item.id }, data: { status: 'PROCESSING' } })

        try {
            if (campaign.contentType === 'pillar') {
                await processPillarItem(item, campaign, settings)
            } else {
                await processPostItem(item, campaign, settings)
            }

            await prisma.queueItem.update({
                where: { id: item.id },
                data: { status: 'DONE', processedAt: new Date() },
            })

            await prisma.campaign.update({
                where: { id: campaignId },
                data: { completedItems: { increment: 1 } },
            })

            processed++
        } catch (err: any) {
            await prisma.queueItem.update({
                where: { id: item.id },
                data: { status: 'ERROR', error: err.message || 'Unknown error' },
            })
            errors++
        }
    }

    // Check if all done
    const remaining = await prisma.queueItem.count({
        where: { campaignId, status: 'PENDING' },
    })
    if (remaining === 0 && pendingItems.length > 0) {
        await prisma.campaign.update({ where: { id: campaignId }, data: { status: 'COMPLETED' } })
    }

    revalidatePath(`/campaigns/${campaignId}`)
    return { processed, errors }
}

// ─── Internal: process a single post item ─────────────────────────────────
async function processPostItem(item: any, campaign: any, settings: any) {
    // Create a batch for this campaign run if not exists
    const batchName = `Campaign: ${campaign.name}`

    // Find or create a batch tied to this campaign
    let batch = await prisma.batch.findFirst({
        where: { name: batchName, siteId: campaign.siteId },
    })
    if (!batch) {
        batch = await prisma.batch.create({
            data: { name: batchName, siteId: campaign.siteId },
        })
    }

    // Create the post
    const post = await prisma.post.create({
        data: {
            batchId: batch.id,
            keyword: item.keyword,
            status: 'QUEUED',
        },
    })

    // Run through all steps automatically
    const { processPostStep } = await import('./process')
    for (let step = 0; step <= 6; step++) {
        const result = await processPostStep(post.id)
        if (result?.done) break
    }

    // Reload post to get final state
    const finalPost = await prisma.post.findUnique({ where: { id: post.id } })

    // Auto publish if configured
    let wpLink: string | undefined
    if (campaign.autoPublish && campaign.siteId && finalPost?.status === 'DONE') {
        const site = await prisma.site.findUnique({ where: { id: campaign.siteId } })
        if (site) {
            const { publishToWordPress } = await import('@/lib/wordpress')
            const content = finalPost.content ? JSON.parse(finalPost.content) : {}
            const result = await publishToWordPress({
                title: content.title || item.keyword,
                content: content.body || '',
                slug: content.slug || '',
                tags: content.tags || '',
                metaDescription: content.meta_description || '',
                featuredImageUrl: finalPost.featuredImageUrl || undefined,
            }, site)
            wpLink = result.link
        }
    }

    await prisma.queueItem.update({
        where: { id: item.id },
        data: { postId: post.id, wpLink },
    })
}

// ─── Internal: process a pillar article item ──────────────────────────────
async function processPillarItem(item: any, campaign: any, _settings: any) {
    const { createPillarArticle, generatePillarOutline, generatePillarSection } = await import('./generate-pillar')

    const fd = new FormData()
    fd.set('keyword', item.keyword)
    fd.set('title', item.keyword)
    fd.set('targetWords', '3000')

    const createResult = await createPillarArticle(fd)
    if (!createResult.success || !createResult.id) throw new Error(createResult.error || 'Failed to create pillar')

    const pillarId = createResult.id

    // Link siteId if available
    if (campaign.siteId) {
        await prisma.pillarArticle.update({ where: { id: pillarId }, data: { siteId: campaign.siteId } })
    }

    // Generate outline
    const outlineResult = await generatePillarOutline(pillarId)
    if (!outlineResult.success) throw new Error(outlineResult.error || 'Outline generation failed')

    // Generate all sections
    const pillar = await prisma.pillarArticle.findUnique({ where: { id: pillarId } })
    const outline = pillar?.outline ? JSON.parse(pillar.outline) : []

    for (let i = 0; i < outline.length; i++) {
        await generatePillarSection(pillarId, i)
    }

    // Auto publish if configured
    let wpLink: string | undefined
    if (campaign.autoPublish && campaign.siteId) {
        const { publishPillarArticleToWP } = await import('./generate-pillar')
        const result = await publishPillarArticleToWP(pillarId, campaign.siteId)
        wpLink = result.wpLink
    }

    await prisma.queueItem.update({
        where: { id: item.id },
        data: { pillarId, wpLink },
    })
}
