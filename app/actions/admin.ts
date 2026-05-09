'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

// ─── Helper: Require Admin ─────────────────────────────────────────────────
async function requireAdmin() {
    const session = await auth()
    if (session?.user?.role !== 'ADMIN') throw new Error('Unauthorized: Admin access required')
    return session
}

// ─── System Stats ──────────────────────────────────────────────────────────
export async function getSystemStats() {
    await requireAdmin()

    const [
        totalUsers, totalPosts, totalPillars, totalBatches,
        totalCampaigns, totalSites, totalLogs, totalPillarLogs,
        totalUsageLogs, totalQueueItems,
        donePosts, errorPosts, processingPosts, queuedPosts,
        activeCampaigns, completedCampaigns,
        totalCost
    ] = await Promise.all([
        prisma.user.count(),
        prisma.post.count(),
        prisma.pillarArticle.count(),
        prisma.batch.count(),
        prisma.campaign.count(),
        prisma.site.count(),
        prisma.log.count(),
        prisma.pillarLog.count(),
        prisma.usageLog.count(),
        prisma.queueItem.count(),
        prisma.post.count({ where: { status: 'DONE' } }),
        prisma.post.count({ where: { status: 'ERROR' } }),
        prisma.post.count({ where: { status: 'PROCESSING' } }),
        prisma.post.count({ where: { status: 'QUEUED' } }),
        prisma.campaign.count({ where: { status: 'ACTIVE' } }),
        prisma.campaign.count({ where: { status: 'COMPLETED' } }),
        prisma.usageLog.aggregate({ _sum: { costUsd: true } }),
    ])

    return {
        users: totalUsers,
        posts: { total: totalPosts, done: donePosts, error: errorPosts, processing: processingPosts, queued: queuedPosts },
        pillars: totalPillars,
        batches: totalBatches,
        campaigns: { total: totalCampaigns, active: activeCampaigns, completed: completedCampaigns },
        sites: totalSites,
        logs: totalLogs + totalPillarLogs,
        usageLogs: totalUsageLogs,
        queueItems: totalQueueItems,
        totalCost: totalCost._sum.costUsd || 0,
    }
}

// ─── Clear All Logs ────────────────────────────────────────────────────────
export async function clearAllLogs() {
    await requireAdmin()
    const [logResult, pillarLogResult] = await Promise.all([
        prisma.log.deleteMany(),
        prisma.pillarLog.deleteMany(),
    ])
    revalidatePath('/admin')
    revalidatePath('/logs')
    return { success: true, cleared: logResult.count + pillarLogResult.count }
}

// ─── Clear Usage Logs ──────────────────────────────────────────────────────
export async function clearUsageLogs() {
    await requireAdmin()
    const result = await prisma.usageLog.deleteMany()
    revalidatePath('/admin')
    revalidatePath('/analytics')
    return { success: true, cleared: result.count }
}

// ─── Reset All Error Posts ─────────────────────────────────────────────────
export async function resetAllErrorPosts() {
    await requireAdmin()
    const result = await prisma.post.updateMany({
        where: { status: 'ERROR' },
        data: { status: 'QUEUED', step: 0 }
    })
    revalidatePath('/admin')
    revalidatePath('/posts')
    revalidatePath('/projects')
    return { success: true, count: result.count }
}

// ─── Purge All Posts & Batches ─────────────────────────────────────────────
export async function purgeAllContent() {
    await requireAdmin()

    // Order matters due to foreign keys
    await prisma.log.deleteMany()
    await prisma.queueItem.deleteMany()
    await prisma.post.deleteMany()
    await prisma.pillarLog.deleteMany()
    await prisma.pillarArticle.deleteMany()
    await prisma.campaign.deleteMany()
    await prisma.batch.deleteMany()
    await prisma.usageLog.deleteMany()

    revalidatePath('/')
    revalidatePath('/admin')
    revalidatePath('/posts')
    revalidatePath('/projects')
    revalidatePath('/campaigns')
    revalidatePath('/pillar')
    revalidatePath('/analytics')
    return { success: true }
}

// ─── Get Recent Activity Feed ──────────────────────────────────────────────
export async function getRecentActivity(limit = 50) {
    await requireAdmin()

    const [logs, pillarLogs] = await Promise.all([
        prisma.log.findMany({
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: { post: { select: { keyword: true } } },
        }),
        prisma.pillarLog.findMany({
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: { pillar: { select: { title: true } } },
        }),
    ])

    // Merge and sort
    const merged = [
        ...logs.map(l => ({
            id: l.id,
            message: l.message,
            level: l.level,
            source: 'post' as const,
            keyword: l.post?.keyword || null,
            createdAt: l.createdAt,
        })),
        ...pillarLogs.map(l => ({
            id: l.id,
            message: l.message,
            level: l.level,
            source: 'pillar' as const,
            keyword: l.pillar?.title || null,
            createdAt: l.createdAt,
        })),
    ]
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, limit)

    return merged
}

// ─── Get Database Table Sizes ──────────────────────────────────────────────
export async function getDatabaseInfo() {
    await requireAdmin()

    const [users, posts, pillars, batches, campaigns, sites, logs, pillarLogs, usageLogs, queueItems] = await Promise.all([
        prisma.user.count(),
        prisma.post.count(),
        prisma.pillarArticle.count(),
        prisma.batch.count(),
        prisma.campaign.count(),
        prisma.site.count(),
        prisma.log.count(),
        prisma.pillarLog.count(),
        prisma.usageLog.count(),
        prisma.queueItem.count(),
    ])

    return [
        { table: 'Users', count: users, icon: '👤' },
        { table: 'Posts', count: posts, icon: '📝' },
        { table: 'Pillar Articles', count: pillars, icon: '📚' },
        { table: 'Batches', count: batches, icon: '📦' },
        { table: 'Campaigns', count: campaigns, icon: '⚡' },
        { table: 'Sites', count: sites, icon: '🌐' },
        { table: 'Queue Items', count: queueItems, icon: '📋' },
        { table: 'Post Logs', count: logs, icon: '📄' },
        { table: 'Pillar Logs', count: pillarLogs, icon: '📄' },
        { table: 'Usage Logs', count: usageLogs, icon: '📊' },
    ]
}

// ─── Force Reset a Stuck Post ──────────────────────────────────────────────
export async function forceResetPost(postId: string) {
    await requireAdmin()
    await prisma.post.update({
        where: { id: postId },
        data: { status: 'QUEUED', step: 0 }
    })
    revalidatePath('/posts')
    revalidatePath(`/posts/${postId}`)
    return { success: true }
}

// ─── Delete All Sites ──────────────────────────────────────────────────────
export async function deleteAllSites() {
    await requireAdmin()
    // Need to unlink batches, pillars, campaigns first
    await prisma.batch.updateMany({ data: { siteId: null } })
    await prisma.pillarArticle.updateMany({ data: { siteId: null } })
    await prisma.campaign.updateMany({ data: { siteId: null } })
    const result = await prisma.site.deleteMany()
    revalidatePath('/admin')
    revalidatePath('/sites')
    return { success: true, count: result.count }
}

// ═══════════════════════════════════════════════════════════════════════════
// TOKEN SUBSCRIPTION & USAGE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

function getTierPresets(): Record<string, { monthlyTokens: number; monthlyPosts: number }> {
    return {
        FREE: { monthlyTokens: 50000, monthlyPosts: 10 },
        PRO: { monthlyTokens: 500000, monthlyPosts: 100 },
        ENTERPRISE: { monthlyTokens: 0, monthlyPosts: 0 }, // unlimited
        CUSTOM: { monthlyTokens: 0, monthlyPosts: 0 },
    }
}

// ─── Get All Users with Quota Info ─────────────────────────────────────────
export async function getUserQuotas() {
    await requireAdmin()

    const users = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true,
            isActive: true,
            subscriptionTier: true,
            monthlyTokenLimit: true,
            tokensUsedThisMonth: true,
            monthlyPostLimit: true,
            postsUsedThisMonth: true,
            currentPeriodStart: true,
            createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
    })

    return users
}

// ─── Update User Quota / Tier ──────────────────────────────────────────────
export async function updateUserQuota(userId: string, data: {
    subscriptionTier?: string
    monthlyTokenLimit?: number
    monthlyPostLimit?: number
}) {
    await requireAdmin()

    const updateData: any = {}

    if (data.subscriptionTier) {
        updateData.subscriptionTier = data.subscriptionTier
        // Auto-set limits from preset unless CUSTOM
        if (data.subscriptionTier !== 'CUSTOM' && getTierPresets()[data.subscriptionTier]) {
            updateData.monthlyTokenLimit = getTierPresets()[data.subscriptionTier].monthlyTokens
            updateData.monthlyPostLimit = getTierPresets()[data.subscriptionTier].monthlyPosts
        }
    }

    // Custom overrides
    if (data.monthlyTokenLimit !== undefined) updateData.monthlyTokenLimit = data.monthlyTokenLimit
    if (data.monthlyPostLimit !== undefined) updateData.monthlyPostLimit = data.monthlyPostLimit

    await prisma.user.update({ where: { id: userId }, data: updateData })
    revalidatePath('/admin')
    revalidatePath('/admin/users')
    return { success: true }
}

// ─── Toggle User Active/Disabled ───────────────────────────────────────────
export async function toggleUserActive(userId: string) {
    await requireAdmin()
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { isActive: true } })
    if (!user) throw new Error('User not found')

    await prisma.user.update({
        where: { id: userId },
        data: { isActive: !user.isActive }
    })
    revalidatePath('/admin')
    revalidatePath('/admin/users')
    return { success: true, isActive: !user.isActive }
}

// ─── Reset Monthly Usage for a User ───────────────────────────────────────
export async function resetMonthlyUsage(userId: string) {
    await requireAdmin()
    await prisma.user.update({
        where: { id: userId },
        data: {
            tokensUsedThisMonth: 0,
            postsUsedThisMonth: 0,
            currentPeriodStart: new Date(),
        }
    })
    revalidatePath('/admin')
    revalidatePath('/admin/users')
    return { success: true }
}

// ─── Reset All Users' Monthly Usage ────────────────────────────────────────
export async function resetAllMonthlyUsage() {
    await requireAdmin()
    const result = await prisma.user.updateMany({
        data: {
            tokensUsedThisMonth: 0,
            postsUsedThisMonth: 0,
            currentPeriodStart: new Date(),
        }
    })
    revalidatePath('/admin')
    revalidatePath('/admin/users')
    return { success: true, count: result.count }
}

// ═══════════════════════════════════════════════════════════════════════════
// USAGE ENFORCEMENT (called from generation pipeline)
// ═══════════════════════════════════════════════════════════════════════════

// Check if a user has quota remaining — call BEFORE starting generation
export async function checkUserQuota(userId: string): Promise<{ allowed: boolean; reason?: string }> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            isActive: true,
            role: true,
            monthlyTokenLimit: true,
            tokensUsedThisMonth: true,
            monthlyPostLimit: true,
            postsUsedThisMonth: true,
            currentPeriodStart: true,
        }
    })

    if (!user) return { allowed: false, reason: 'User not found' }
    if (!user.isActive) return { allowed: false, reason: 'Account is disabled' }
    if (user.role === 'ADMIN') return { allowed: true } // Admins bypass quotas

    // Auto-reset if period has expired (30 days)
    const periodAge = Date.now() - user.currentPeriodStart.getTime()
    if (periodAge > 30 * 24 * 60 * 60 * 1000) {
        await prisma.user.update({
            where: { id: userId },
            data: { tokensUsedThisMonth: 0, postsUsedThisMonth: 0, currentPeriodStart: new Date() }
        })
        return { allowed: true }
    }

    // Check token limit (0 = unlimited)
    if (user.monthlyTokenLimit > 0 && user.tokensUsedThisMonth >= user.monthlyTokenLimit) {
        return { allowed: false, reason: `Monthly token limit reached (${user.tokensUsedThisMonth.toLocaleString()}/${user.monthlyTokenLimit.toLocaleString()})` }
    }

    // Check post limit (0 = unlimited)
    if (user.monthlyPostLimit > 0 && user.postsUsedThisMonth >= user.monthlyPostLimit) {
        return { allowed: false, reason: `Monthly post limit reached (${user.postsUsedThisMonth}/${user.monthlyPostLimit})` }
    }

    return { allowed: true }
}

// Record usage after generation completes
export async function recordUserUsage(userId: string, tokens: number, posts: number = 1) {
    await prisma.user.update({
        where: { id: userId },
        data: {
            tokensUsedThisMonth: { increment: tokens },
            postsUsedThisMonth: { increment: posts },
        }
    })
}
