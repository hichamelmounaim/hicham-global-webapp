import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { PlusCircle, Activity, BarChart3, CheckCircle2, Zap, Settings as SettingsIcon, ArrowUpRight, Clock, Sparkles, Globe } from "lucide-react"

export default async function DashboardPage() {
  const [totalPosts, activeJobs, completedPosts, recentBatches] = await Promise.all([
    prisma.post.count(),
    prisma.post.count({ where: { status: "PROCESSING" } }),
    prisma.post.count({ where: { status: "DONE" } }),
    prisma.batch.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { posts: true } }
      }
    })
  ])

  return (
    <div className="space-y-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-outline-variant/10">
        <div className="space-y-2">
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-foreground font-display">
            COMMAND <span className="text-primary italic">CENTER</span>
          </h1>
          <p className="text-foreground/50 text-base md:text-lg font-medium max-w-md leading-relaxed">
            Orchestrating high-frequency content automation across your global network.
          </p>
        </div>
        <Link href="/projects/new">
          <Button size="lg" className="h-14 px-8 rounded-2xl bg-gradient-to-r from-primary to-primary-container text-on-primary font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20 gap-3">
            <PlusCircle className="h-5 w-5" />
            Initialize Batch
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[
          { label: 'Total Library', value: totalPosts, icon: BarChart3, color: 'primary', sub: 'Indexed Posts' },
          { label: 'Active Jobs', value: activeJobs, icon: Activity, color: 'secondary', sub: 'Real-time Processing' },
          { 
            label: 'Success Rate', 
            value: totalPosts > 0 ? `${Math.round((completedPosts / totalPosts) * 100)}%` : '0%', 
            icon: Zap, 
            color: 'tertiary', 
            sub: 'Operational Efficiency' 
          },
        ].map((stat, i) => (
          <Card key={i} className="relative overflow-hidden group bg-surface-container-low border-outline-variant/5 shadow-2xl transition-all duration-500 hover:bg-surface-container-high">
            <div className={`absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-700`}>
                <stat.icon className="h-32 w-32" />
            </div>
            {/* Holographic light effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/[0.02] to-transparent pointer-events-none" />
            
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">{stat.label}</CardTitle>
              <div className={`p-2.5 rounded-xl bg-${stat.color}/10 border border-${stat.color}/20 text-${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-display font-black tracking-tighter text-foreground mb-1">
                {stat.value}
              </div>
              <div className="flex items-center gap-1.5">
                <div className={`w-1 h-1 rounded-full bg-${stat.color}`} />
                <p className="text-[10px] text-foreground/40 font-bold uppercase tracking-wider">
                  {stat.sub}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Start Guide */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-3xl p-8 border border-primary/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-[0.02]">
            <Sparkles className="h-48 w-48" />
        </div>
        <div className="relative z-10">
          <h2 className="text-2xl font-black uppercase tracking-tight text-foreground font-display mb-2 flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-primary" />
            Quick Start Guide
          </h2>
          <p className="text-foreground/60 mb-6 max-w-2xl text-sm font-medium">
            Follow these steps to set up your automated content generation pipeline and start publishing to your sites.
          </p>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              { step: '01', title: 'Configure System', desc: 'Add your API keys in Settings to enable the AI engine.', icon: SettingsIcon, href: '/settings' },
              { step: '02', title: 'Connect Sites', desc: 'Add your WordPress sites where content will be published.', icon: Globe, href: '/sites' },
              { step: '03', title: 'Initialize Batch', desc: 'Create a new project with your keywords and parameters.', icon: PlusCircle, href: '/projects/new' },
              { step: '04', title: 'Monitor Activity', desc: 'Track generation progress and successful publications.', icon: Activity, href: '/analytics' }
            ].map((s, i) => (
              <Link key={i} href={s.href} className="group relative bg-surface-container-low rounded-2xl p-5 border border-outline-variant/10 hover:border-primary/30 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5 block">
                <div className="text-[10px] font-black tracking-widest text-primary/50 mb-3 uppercase">Step {s.step}</div>
                <div className="mb-2 text-foreground group-hover:text-primary transition-colors">
                  <s.icon className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-sm mb-1">{s.title}</h3>
                <p className="text-xs text-foreground/50 leading-relaxed">{s.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Secondary Content Grid */}
      <div className="grid gap-8 lg:grid-cols-12 items-start">
        {/* Recent Activity */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-secondary rounded-full" />
              <h2 className="text-xl font-black uppercase tracking-tight text-foreground font-display">Recent Activity</h2>
            </div>
            <Link href="/projects" className="text-xs font-bold text-primary flex items-center gap-1 hover:underline underline-offset-4 decoration-2">
                View Archive <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="bg-surface-container-low rounded-3xl border border-outline-variant/5 overflow-hidden shadow-sm">
            {recentBatches.length > 0 ? (
              <div className="divide-y divide-outline-variant/5">
                {recentBatches.map((batch) => (
                  <Link
                    key={batch.id}
                    href={`/projects/${batch.id}`}
                    className="flex items-center justify-between p-5 hover:bg-surface-container-high transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-surface-container-highest border border-outline-variant/10 flex items-center justify-center text-foreground/30 group-hover:text-primary group-hover:border-primary/20 transition-colors">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold text-base text-foreground group-hover:text-primary transition-colors">{batch.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] bg-outline-variant/10 text-foreground/60 px-2 py-0.5 rounded-full font-bold uppercase">{batch._count.posts} Keywords</span>
                            <span className="text-[10px] text-foreground/30 font-medium">•</span>
                            <span className="text-[10px] text-foreground/30 font-medium capitalize">Async Processing</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-surface-container-high group-hover:bg-primary/10 transition-colors">
                        <ArrowUpRight className="h-4 w-4 text-foreground/20 group-hover:text-primary transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center mb-4 text-foreground/20">
                    <Activity className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Awaiting Initialization</h3>
                <p className="text-sm text-foreground/40 mt-1 max-w-[240px]">No recent batches detected. Initialize your first batch to start automation.</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Management */}
        <div className="lg:col-span-4 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-primary rounded-full" />
            <h2 className="text-xl font-black uppercase tracking-tight text-foreground font-display">Control</h2>
          </div>
          
          <div className="grid gap-3">
            {[
                { href: '/projects/new', label: 'Create New Batch', sub: 'Define keywords & configuration', icon: PlusCircle, color: 'primary' },
                { href: '/settings', label: 'Configure System', sub: 'Manage API keys & persona', icon: SettingsIcon, color: 'secondary' },
                { href: '/sites', label: 'Manage Sites', sub: 'Connected WordPress instances', icon: Zap, color: 'tertiary' }
            ].map((action, i) => (
                <Link key={i} href={action.href}>
                    <button className="w-full text-left p-4 rounded-2xl bg-surface-container-low border border-outline-variant/5 hover:bg-surface-container-high hover:border-outline-variant/20 group transition-all">
                        <div className="flex items-start gap-4">
                            <div className={`p-2.5 rounded-xl bg-${action.color}/5 text-${action.color}/40 group-hover:text-${action.color} group-hover:bg-${action.color}/10 transition-all`}>
                                <action.icon className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{action.label}</p>
                                <p className="text-[10px] text-foreground/40 font-medium mt-0.5">{action.sub}</p>
                            </div>
                        </div>
                    </button>
                </Link>
            ))}
          </div>

          {/* System Health / Status */}
          <div className="p-6 rounded-3xl bg-primary/[0.03] border border-primary/10 relative overflow-hidden">
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 blur-3xl rounded-full" />
                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-1">System Health</p>
                        <p className="text-sm font-bold text-foreground">Operational</p>
                    </div>
                    <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((_, i) => (
                            <div key={i} className={`w-1.5 h-4 rounded-full bg-primary ${i === 4 ? 'animate-pulse' : ''}`} />
                        ))}
                    </div>
                </div>
          </div>
        </div>
      </div>
    </div>
  )
}
