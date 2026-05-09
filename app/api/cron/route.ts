import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { processCampaignRun } from '@/app/actions/campaigns'

/**
 * Secure CRON endpoint — trigger by:
 * - Vercel Cron (set in vercel.json), or
 * - External ping (cron-job.org, EasyCron, etc.)
 * - Manual call: GET /api/cron?secret=YOUR_CRON_SECRET
 * 
 * Set CRON_SECRET in .env to protect this endpoint.
 */
export async function GET(req: NextRequest) {
    const secret = req.nextUrl.searchParams.get('secret')
    const cronSecret = process.env.CRON_SECRET

    // ALWAYS require a secret — deny if not configured or mismatch
    if (!cronSecret || secret !== cronSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        // Fetch all ACTIVE campaigns
        const activeCampaigns = await prisma.campaign.findMany({
            where: { status: 'ACTIVE' },
            select: { id: true, name: true },
        })

        const results: Record<string, { processed: number; errors: number }> = {}

        for (const campaign of activeCampaigns) {
            try {
                const result = await processCampaignRun(campaign.id)
                results[campaign.name] = result
            } catch (err: any) {
                results[campaign.name] = { processed: 0, errors: 1 }
                console.error(`Campaign "${campaign.name}" run error:`, err.message)
            }
        }

        const totalProcessed = Object.values(results).reduce((s, r) => s + r.processed, 0)
        const totalErrors = Object.values(results).reduce((s, r) => s + r.errors, 0)

        return NextResponse.json({
            ok: true,
            campaigns: activeCampaigns.length,
            totalProcessed,
            totalErrors,
            results,
            timestamp: new Date().toISOString(),
        })
    } catch (err: any) {
        return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
    }
}

// Allow Vercel Cron to call via POST too
export { GET as POST }
