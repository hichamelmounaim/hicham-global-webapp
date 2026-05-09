import { getAnalyticsData } from '@/app/actions/analytics'
import { AnalyticsCharts } from './AnalyticsCharts'
import { BarChart2, Zap } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = {
    title: 'Analytics | Hicham Global',
    description: 'Token usage, API cost breakdown, and content generation analytics.',
}
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function AnalyticsPage() {
    const session = await auth()
    if (session?.user?.role !== 'ADMIN') {
        redirect('/')
    }

    const data = await getAnalyticsData()

    return (
        <div className="max-w-6xl space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-400 border border-violet-500/20">
                    <BarChart2 className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-black tracking-tight">Analytics</h1>
                    <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
                        <Zap className="h-3 w-3 text-amber-400" />
                        Token consumption, API costs, and generation performance
                    </p>
                </div>
            </div>

            <AnalyticsCharts data={data} />
        </div>
    )
}
