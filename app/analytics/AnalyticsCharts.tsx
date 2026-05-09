'use client'

import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts'

type Props = { data: Awaited<ReturnType<typeof import('@/app/actions/analytics').getAnalyticsData>> }

const CHART_COLORS = [
    'hsl(265, 89%, 70%)',
    'hsl(190, 90%, 55%)',
    'hsl(340, 75%, 60%)',
    'hsl(43, 96%, 60%)',
    'hsl(150, 60%, 50%)',
    'hsl(210, 80%, 60%)',
]

const TOOLTIP_STYLE = {
    backgroundColor: 'hsl(240, 10%, 10%)',
    border: '1px solid hsl(240, 10%, 18%)',
    borderRadius: '12px',
    color: '#fff',
    fontSize: 12,
}

function fmt(n: number) { return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n) }
function fmtCost(n: number) { return `$${n.toFixed(4)}` }

export function AnalyticsCharts({ data }: Props) {
    const { summary, dailyChart, modelChart, operationChart, recentLogs } = data

    return (
        <div className="space-y-8">
            {/* ── Summary Cards ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Tokens', value: fmt(summary.totalTokens), sub: `${summary.totalOperations} operations`, color: 'from-violet-500/20 to-violet-500/5', accent: 'text-violet-400' },
                    { label: 'Total Cost', value: fmtCost(summary.totalCost), sub: 'All API calls', color: 'from-cyan-500/20 to-cyan-500/5', accent: 'text-cyan-400' },
                    { label: 'Pillar Articles', value: String(summary.totalPillars), sub: fmtCost(summary.pillarCost), color: 'from-pink-500/20 to-pink-500/5', accent: 'text-pink-400' },
                    { label: 'Posts Generated', value: String(summary.totalPosts), sub: fmtCost(summary.postCost), color: 'from-amber-500/20 to-amber-500/5', accent: 'text-amber-400' },
                ].map((card) => (
                    <div key={card.label} className={`rounded-2xl border border-white/5 bg-gradient-to-br ${card.color} p-5 backdrop-blur-sm`}>
                        <p className="text-[10px] uppercase tracking-widest font-black text-muted-foreground">{card.label}</p>
                        <p className={`text-3xl font-black mt-1 ${card.accent}`}>{card.value}</p>
                        <p className="text-xs text-muted-foreground mt-1 font-medium">{card.sub}</p>
                    </div>
                ))}
            </div>

            {/* ── Daily Token Usage ── */}
            {dailyChart.length > 0 ? (
                <div className="rounded-2xl border border-white/5 bg-card p-6">
                    <h3 className="text-sm font-black uppercase tracking-widest mb-5 text-muted-foreground">📈 Daily Token Usage</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={dailyChart} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="tokenGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(265,89%,70%)" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="hsl(265,89%,70%)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(240,10%,15%)" />
                            <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(240,5%,55%)' }} />
                            <YAxis tickFormatter={fmt} tick={{ fontSize: 10, fill: 'hsl(240,5%,55%)' }} />
                            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => [fmt(v), 'Tokens']} />
                            <Area type="monotone" dataKey="tokens" stroke="hsl(265,89%,70%)" fill="url(#tokenGrad)" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <EmptyState label="No usage data yet. Generate articles to start tracking." />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ── Cost by Model ── */}
                <div className="rounded-2xl border border-white/5 bg-card p-6">
                    <h3 className="text-sm font-black uppercase tracking-widest mb-5 text-muted-foreground">🧠 Cost by Model</h3>
                    {modelChart.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={modelChart} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240,10%,15%)" />
                                <XAxis type="number" tickFormatter={fmtCost} tick={{ fontSize: 10, fill: 'hsl(240,5%,55%)' }} />
                                <YAxis type="category" dataKey="model" tick={{ fontSize: 9, fill: 'hsl(240,5%,55%)' }} width={130}
                                    tickFormatter={(v: string) => v.split('/')[1] || v} />
                                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => [fmtCost(v), 'Cost']} />
                                <Bar dataKey="cost" radius={[0, 6, 6, 0]}>
                                    {modelChart.map((_, i) => (
                                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : <EmptyState label="No model data yet." />}
                </div>

                {/* ── Cost by Operation ── */}
                <div className="rounded-2xl border border-white/5 bg-card p-6">
                    <h3 className="text-sm font-black uppercase tracking-widest mb-5 text-muted-foreground">⚙️ Tokens by Operation</h3>
                    {operationChart.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie
                                    data={operationChart}
                                    dataKey="tokens"
                                    nameKey="operation"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    label={(props: any) =>
                                        `${props.operation || props.name} (${(props.percent * 100).toFixed(0)}%)`
                                    }
                                    labelLine={false}
                                >
                                    {operationChart.map((_, i) => (
                                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Legend formatter={(v) => <span className="text-xs text-muted-foreground">{v}</span>} />
                                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => [fmt(v), 'Tokens']} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : <EmptyState label="No operation data yet." />}
                </div>
            </div>

            {/* ── Recent Calls Table ── */}
            <div className="rounded-2xl border border-white/5 bg-card p-6 overflow-hidden">
                <h3 className="text-sm font-black uppercase tracking-widest mb-5 text-muted-foreground">🧾 Recent API Calls</h3>
                {recentLogs.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-white/5 text-left">
                                    <th className="pb-3 pr-4 font-black uppercase tracking-widest text-muted-foreground">Model</th>
                                    <th className="pb-3 pr-4 font-black uppercase tracking-widest text-muted-foreground">Operation</th>
                                    <th className="pb-3 pr-4 font-black uppercase tracking-widest text-muted-foreground">Tokens</th>
                                    <th className="pb-3 pr-4 font-black uppercase tracking-widest text-muted-foreground">Cost</th>
                                    <th className="pb-3 font-black uppercase tracking-widest text-muted-foreground">Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {recentLogs.map((log) => (
                                    <tr key={log.id} className="group hover:bg-white/[0.02] transition-colors">
                                        <td className="py-3 pr-4 font-mono text-cyan-400 font-medium">
                                            {log.model.split('/')[1] || log.model}
                                        </td>
                                        <td className="py-3 pr-4">
                                            <span className="px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-300 font-mono text-[10px]">
                                                {log.operation}
                                            </span>
                                        </td>
                                        <td className="py-3 pr-4 font-mono text-foreground/60">{fmt(log.totalTokens)}</td>
                                        <td className="py-3 pr-4 font-mono text-amber-400">{fmtCost(log.costUsd)}</td>
                                        <td className="py-3 text-muted-foreground">
                                            {new Date(log.createdAt).toLocaleDateString('en-GB', {
                                                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : <EmptyState label="No API calls logged yet. Start generating content!" />}
            </div>
        </div>
    )
}

function EmptyState({ label }: { label: string }) {
    return (
        <div className="py-16 text-center text-muted-foreground/40">
            <p className="text-sm font-medium">{label}</p>
        </div>
    )
}
