'use server'

import { prisma } from '@/lib/prisma'

export async function getAnalyticsData() {
    const [usageLogs, pillars, posts] = await Promise.all([
        prisma.usageLog.findMany({ orderBy: { createdAt: 'asc' } }),
        prisma.pillarArticle.findMany({
            select: { id: true, title: true, status: true, promptTokens: true, completionTokens: true, costUsd: true, createdAt: true }
        }),
        prisma.post.findMany({
            select: { id: true, keyword: true, status: true, promptTokens: true, completionTokens: true, costUsd: true, createdAt: true }
        }),
    ])

    // Aggregate by day for chart
    const byDay: Record<string, { date: string; tokens: number; cost: number; operations: number }> = {}
    for (const log of usageLogs) {
        const day = log.createdAt.toISOString().slice(0, 10)
        if (!byDay[day]) byDay[day] = { date: day, tokens: 0, cost: 0, operations: 0 }
        byDay[day].tokens += log.totalTokens
        byDay[day].cost += log.costUsd
        byDay[day].operations += 1
    }

    // Aggregate by model
    const byModel: Record<string, { model: string; tokens: number; cost: number; calls: number }> = {}
    for (const log of usageLogs) {
        if (!byModel[log.model]) byModel[log.model] = { model: log.model, tokens: 0, cost: 0, calls: 0 }
        byModel[log.model].tokens += log.totalTokens
        byModel[log.model].cost += log.costUsd
        byModel[log.model].calls += 1
    }

    // Aggregate by operation type
    const byOperation: Record<string, { operation: string; tokens: number; cost: number }> = {}
    for (const log of usageLogs) {
        const op = log.operation.startsWith('section') ? 'section' : log.operation
        if (!byOperation[op]) byOperation[op] = { operation: op, tokens: 0, cost: 0 }
        byOperation[op].tokens += log.totalTokens
        byOperation[op].cost += log.costUsd
    }

    const totalTokens = usageLogs.reduce((s, l) => s + l.totalTokens, 0)
    const totalCost = usageLogs.reduce((s, l) => s + l.costUsd, 0)
    const totalPillarCost = pillars.reduce((s, p) => s + p.costUsd, 0)
    const totalPostCost = posts.reduce((s, p) => s + p.costUsd, 0)

    return {
        summary: {
            totalTokens,
            totalCost: parseFloat(totalCost.toFixed(4)),
            totalOperations: usageLogs.length,
            totalPillars: pillars.length,
            totalPosts: posts.length,
            pillarCost: parseFloat(totalPillarCost.toFixed(4)),
            postCost: parseFloat(totalPostCost.toFixed(4)),
        },
        dailyChart: Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date)).map(d => ({
            ...d,
            cost: parseFloat(d.cost.toFixed(4)),
        })),
        modelChart: Object.values(byModel)
            .sort((a, b) => b.tokens - a.tokens)
            .map(m => ({ ...m, cost: parseFloat(m.cost.toFixed(4)) })),
        operationChart: Object.values(byOperation)
            .sort((a, b) => b.tokens - a.tokens)
            .map(o => ({ ...o, cost: parseFloat(o.cost.toFixed(4)) })),
        recentLogs: usageLogs.slice(-50).reverse().map(l => ({
            ...l,
            createdAt: l.createdAt.toISOString(),
            costUsd: parseFloat(l.costUsd.toFixed(6)),
        })),
    }
}
