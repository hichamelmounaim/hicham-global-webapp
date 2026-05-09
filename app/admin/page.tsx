import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getSystemStats, getDatabaseInfo, getRecentActivity } from '@/app/actions/admin'
import { AdminDashboardClient } from './AdminDashboardClient'
import {
    ShieldCheck, Users, FileText, Layers, Zap, Globe, Database, DollarSign,
    Activity, AlertTriangle, CheckCircle2, Clock
} from 'lucide-react'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Admin Dashboard | Hicham Global' }

export default async function AdminDashboardPage() {
    const session = await auth()
    if (!session?.user) redirect('/sign-in')
    if (session.user.role !== 'ADMIN') redirect('/')

    const [stats, dbInfo, activity] = await Promise.all([
        getSystemStats(),
        getDatabaseInfo(),
        getRecentActivity(30),
    ])

    return (
        <div className="max-w-6xl space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-violet-500/20">
                    <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-black tracking-tight">Admin Dashboard</h1>
                    <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
                        <Activity className="h-3 w-3 text-violet-400" />
                        System overview, maintenance tools, and controls
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                {[
                    { label: 'Total Users', value: stats.users, icon: Users, color: 'violet' },
                    { label: 'Total Posts', value: stats.posts.total, icon: FileText, color: 'blue' },
                    { label: 'Pillar Articles', value: stats.pillars, icon: Layers, color: 'cyan' },
                    { label: 'Total Cost', value: `$${stats.totalCost.toFixed(2)}`, icon: DollarSign, color: 'green' },
                    { label: 'Active Campaigns', value: stats.campaigns.active, icon: Zap, color: 'amber' },
                    { label: 'WordPress Sites', value: stats.sites, icon: Globe, color: 'indigo' },
                    { label: 'Error Posts', value: stats.posts.error, icon: AlertTriangle, color: 'red' },
                    { label: 'Completed Posts', value: stats.posts.done, icon: CheckCircle2, color: 'emerald' },
                ].map((stat, i) => (
                    <div key={i} className="rounded-2xl border border-border/40 bg-card p-4 hover:bg-muted/20 transition-all group">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</span>
                            <div className={`p-1.5 rounded-lg bg-${stat.color}-500/10 text-${stat.color}-400`}>
                                <stat.icon className="h-3.5 w-3.5" />
                            </div>
                        </div>
                        <p className="text-2xl font-black tracking-tight">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Post Status Breakdown */}
            <div className="rounded-2xl border border-border/40 bg-card p-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">Post Pipeline Status</h3>
                <div className="flex gap-2 h-6 rounded-full overflow-hidden bg-muted/30">
                    {stats.posts.total > 0 && (
                        <>
                            {stats.posts.done > 0 && (
                                <div
                                    className="bg-green-500 rounded-full flex items-center justify-center min-w-[20px]"
                                    style={{ width: `${(stats.posts.done / stats.posts.total) * 100}%` }}
                                    title={`Done: ${stats.posts.done}`}
                                >
                                    <span className="text-[9px] font-black text-white">{stats.posts.done}</span>
                                </div>
                            )}
                            {stats.posts.processing > 0 && (
                                <div
                                    className="bg-blue-500 rounded-full flex items-center justify-center min-w-[20px] animate-pulse"
                                    style={{ width: `${(stats.posts.processing / stats.posts.total) * 100}%` }}
                                    title={`Processing: ${stats.posts.processing}`}
                                >
                                    <span className="text-[9px] font-black text-white">{stats.posts.processing}</span>
                                </div>
                            )}
                            {stats.posts.queued > 0 && (
                                <div
                                    className="bg-yellow-500 rounded-full flex items-center justify-center min-w-[20px]"
                                    style={{ width: `${(stats.posts.queued / stats.posts.total) * 100}%` }}
                                    title={`Queued: ${stats.posts.queued}`}
                                >
                                    <span className="text-[9px] font-black text-white">{stats.posts.queued}</span>
                                </div>
                            )}
                            {stats.posts.error > 0 && (
                                <div
                                    className="bg-red-500 rounded-full flex items-center justify-center min-w-[20px]"
                                    style={{ width: `${(stats.posts.error / stats.posts.total) * 100}%` }}
                                    title={`Error: ${stats.posts.error}`}
                                >
                                    <span className="text-[9px] font-black text-white">{stats.posts.error}</span>
                                </div>
                            )}
                        </>
                    )}
                </div>
                <div className="flex gap-4 mt-3">
                    {[
                        { label: 'Done', color: 'bg-green-500', count: stats.posts.done },
                        { label: 'Processing', color: 'bg-blue-500', count: stats.posts.processing },
                        { label: 'Queued', color: 'bg-yellow-500', count: stats.posts.queued },
                        { label: 'Error', color: 'bg-red-500', count: stats.posts.error },
                    ].map(s => (
                        <div key={s.label} className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full ${s.color}`} />
                            <span className="text-[10px] font-bold text-muted-foreground">{s.label}: {s.count}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Client Component: Maintenance Tools + DB Info + Activity */}
            <AdminDashboardClient dbInfo={dbInfo} activity={activity} stats={stats} />
        </div>
    )
}
