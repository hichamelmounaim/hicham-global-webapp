'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteUser, updateUserRole, createUser } from '@/app/actions/users'
import { updateUserQuota, toggleUserActive, resetMonthlyUsage, resetAllMonthlyUsage } from '@/app/actions/admin'
import {
    Trash2, ShieldCheck, ShieldOff, UserPlus, Loader2, X, CheckCircle2,
    AlertTriangle, RotateCcw, Power, PowerOff, Crown, ChevronDown, ChevronUp,
    Gauge, Coins, FileText, Zap, Search, Filter, Activity, Settings
} from 'lucide-react'

const TIER_COLORS: Record<string, string> = {
    FREE: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    PRO: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    ENTERPRISE: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    CUSTOM: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
}

const TIER_LABELS: Record<string, string> = {
    FREE: '🆓 Free',
    PRO: '⚡ Pro',
    ENTERPRISE: '👑 Enterprise',
    CUSTOM: '🔧 Custom',
}

interface User {
    id: string; name: string | null; email: string; role: string; avatar: string | null
    isActive: boolean; subscriptionTier: string
    monthlyTokenLimit: number; tokensUsedThisMonth: number
    monthlyPostLimit: number; postsUsedThisMonth: number
    currentPeriodStart: Date; createdAt: Date
}

export function UsersQuotaManager({ users, currentUserId }: { users: User[]; currentUserId: string }) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [showCreate, setShowCreate] = useState(false)
    const [expandedUser, setExpandedUser] = useState<string | null>(null)
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
    const [actionId, setActionId] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [roleFilter, setRoleFilter] = useState<string>('ALL')

    // Custom quota inputs
    const [customTokens, setCustomTokens] = useState<Record<string, number>>({})
    const [customPosts, setCustomPosts] = useState<Record<string, number>>({})

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type })
        setTimeout(() => setToast(null), 4000)
    }

    const handleDelete = (id: string, name: string) => {
        if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return
        setActionId(id)
        startTransition(async () => {
            try { await deleteUser(id); router.refresh(); showToast('User deleted') }
            catch (e: any) { showToast(e.message, 'error') }
            finally { setActionId(null) }
        })
    }

    const handleRoleToggle = (id: string, currentRole: string) => {
        const next = currentRole === 'ADMIN' ? 'USER' : 'ADMIN'
        setActionId(id)
        startTransition(async () => {
            try { await updateUserRole(id, next as any); router.refresh(); showToast(`Role changed to ${next}`) }
            catch (e: any) { showToast(e.message, 'error') }
            finally { setActionId(null) }
        })
    }

    const handleTierChange = (userId: string, tier: string) => {
        setActionId(userId)
        startTransition(async () => {
            try { await updateUserQuota(userId, { subscriptionTier: tier }); router.refresh(); showToast(`Tier changed to ${tier}`) }
            catch (e: any) { showToast(e.message, 'error') }
            finally { setActionId(null) }
        })
    }

    const handleCustomQuota = (userId: string) => {
        setActionId(userId)
        startTransition(async () => {
            try {
                await updateUserQuota(userId, {
                    subscriptionTier: 'CUSTOM',
                    monthlyTokenLimit: customTokens[userId] ?? 0,
                    monthlyPostLimit: customPosts[userId] ?? 0,
                })
                router.refresh()
                showToast('Custom quota saved')
            } catch (e: any) { showToast(e.message, 'error') }
            finally { setActionId(null) }
        })
    }

    const handleToggleActive = (userId: string) => {
        setActionId(userId)
        startTransition(async () => {
            try {
                const result = await toggleUserActive(userId)
                router.refresh()
                showToast(result.isActive ? 'Account enabled' : 'Account disabled')
            } catch (e: any) { showToast(e.message, 'error') }
            finally { setActionId(null) }
        })
    }

    const handleResetUsage = (userId: string) => {
        setActionId(userId)
        startTransition(async () => {
            try { await resetMonthlyUsage(userId); router.refresh(); showToast('Usage reset') }
            catch (e: any) { showToast(e.message, 'error') }
            finally { setActionId(null) }
        })
    }

    const handleResetAll = () => {
        if (!confirm('Reset monthly usage for ALL users? This will reset tokens and post counts.')) return
        startTransition(async () => {
            try { const r = await resetAllMonthlyUsage(); router.refresh(); showToast(`Reset usage for ${r.count} users`) }
            catch (e: any) { showToast(e.message, 'error') }
        })
    }

    const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        try {
            await createUser(fd)
            ;(e.target as HTMLFormElement).reset()
            showToast('User created')
            router.refresh()
            setTimeout(() => setShowCreate(false), 1500)
        } catch (err: any) { showToast(err.message, 'error') }
    }

    const usagePercent = (used: number, limit: number) => {
        if (limit === 0) return 0 // unlimited
        return Math.min(100, Math.round((used / limit) * 100))
    }

    const usageColor = (pct: number) => {
        if (pct >= 90) return 'bg-red-500'
        if (pct >= 70) return 'bg-amber-500'
        return 'bg-emerald-500'
    }

    const filteredUsers = users.filter(u => {
        const matchesSearch = (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                              u.email.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesRole = roleFilter === 'ALL' || u.role === roleFilter
        return matchesSearch && matchesRole
    })

    return (
        <>
            {/* Toast Notification */}
            {toast && (
                <div className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-xl text-sm font-bold animate-in slide-in-from-top-2 duration-300 ${toast.type === 'success'
                    ? 'bg-green-500/10 border-green-500/20 text-green-400'
                    : 'bg-red-500/10 border-red-500/20 text-red-400'
                    }`}>
                    {toast.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                    {toast.message}
                    <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100 transition-opacity"><X className="h-3 w-3" /></button>
                </div>
            )}

            <div className="space-y-6">
                {/* Top Action Bar */}
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-surface-container-low p-4 rounded-2xl border border-border/40 shadow-sm">
                    {/* Search and Filter */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input 
                                type="text" 
                                placeholder="Search users by name or email..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-10 pl-9 pr-4 rounded-xl bg-background border border-border/50 text-sm font-medium outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 transition-all placeholder:text-muted-foreground/50"
                            />
                        </div>
                        <div className="relative w-full sm:w-40 flex-shrink-0">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <select 
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="w-full h-10 pl-9 pr-4 rounded-xl bg-background border border-border/50 text-sm font-medium outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 transition-all appearance-none cursor-pointer"
                            >
                                <option value="ALL">All Roles</option>
                                <option value="ADMIN">Admins</option>
                                <option value="USER">Users</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        </div>
                    </div>

                    {/* Global Actions */}
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button
                            onClick={handleResetAll}
                            disabled={isPending}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-10 px-4 rounded-xl border border-border/40 bg-background text-muted-foreground hover:text-foreground hover:border-amber-500/40 hover:bg-amber-500/5 text-sm font-bold transition-all disabled:opacity-40"
                        >
                            <RotateCcw className="h-4 w-4" /> <span className="hidden sm:inline">Reset All Usage</span>
                        </button>
                        <button
                            onClick={() => setShowCreate(!showCreate)}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-10 px-5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm shadow-md shadow-violet-500/20 transition-all active:scale-95"
                        >
                            {showCreate ? <X className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                            {showCreate ? 'Cancel' : 'Create User'}
                        </button>
                    </div>
                </div>

                {/* Create Form Modal/Card */}
                {showCreate && (
                    <div className="rounded-2xl border border-violet-500/20 bg-violet-500/[0.02] p-6 shadow-sm animate-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-500">
                                <UserPlus className="h-4 w-4" />
                            </div>
                            <h3 className="font-bold text-lg">Create New User</h3>
                        </div>
                        <form onSubmit={handleCreate} className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-muted-foreground">Full Name</label>
                                <input name="name" placeholder="John Doe" className="w-full h-10 px-3 rounded-xl bg-background border border-border/50 text-sm font-medium outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 transition-all" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-muted-foreground">Email Address *</label>
                                <input name="email" type="email" required placeholder="john@example.com" className="w-full h-10 px-3 rounded-xl bg-background border border-border/50 text-sm font-medium outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 transition-all" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-muted-foreground">Password *</label>
                                <input name="password" type="password" required placeholder="Min 6 characters" className="w-full h-10 px-3 rounded-xl bg-background border border-border/50 text-sm font-medium outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 transition-all" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-muted-foreground">Account Role</label>
                                <div className="relative">
                                    <select name="role" className="w-full h-10 px-3 rounded-xl bg-background border border-border/50 text-sm font-medium outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 transition-all appearance-none cursor-pointer">
                                        <option value="USER">User</option>
                                        <option value="ADMIN">Admin</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                </div>
                            </div>
                            <div className="md:col-span-2 lg:col-span-4 flex justify-end mt-2">
                                <button type="submit" className="flex items-center justify-center gap-2 h-10 px-8 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm shadow-md shadow-violet-500/20 transition-all active:scale-95">
                                    Create Account
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Users List */}
                <div className="space-y-3">
                    {filteredUsers.length === 0 ? (
                        <div className="py-12 text-center rounded-2xl border border-dashed border-border/50 bg-surface-container-low">
                            <div className="w-12 h-12 rounded-xl bg-muted/20 mx-auto mb-3 flex items-center justify-center">
                                <Search className="h-6 w-6 text-muted-foreground/50" />
                            </div>
                            <p className="text-sm font-bold text-muted-foreground">No users found matching your criteria</p>
                            <button onClick={() => {setSearchQuery(''); setRoleFilter('ALL')}} className="text-xs font-bold text-violet-400 hover:underline mt-2">Clear Filters</button>
                        </div>
                    ) : filteredUsers.map(u => {
                        const avatar = u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || u.email)}&background=7c3aed&color=fff&bold=true&size=64`
                        const isSelf = u.id === currentUserId
                        const loading = actionId === u.id && isPending
                        const isExpanded = expandedUser === u.id
                        const tokenPct = usagePercent(u.tokensUsedThisMonth, u.monthlyTokenLimit)
                        const postPct = usagePercent(u.postsUsedThisMonth, u.monthlyPostLimit)

                        return (
                            <div key={u.id} className={`rounded-2xl border transition-all duration-200 ${!u.isActive ? 'border-red-500/20 bg-red-500/[0.02] opacity-75' : 'border-border/40 bg-card hover:border-violet-500/20 hover:shadow-sm'} ${isExpanded ? 'ring-1 ring-violet-500/20' : ''}`}>
                                {/* Main Row */}
                                <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                                    {/* Avatar + Info */}
                                    <div className="flex items-center gap-4 min-w-0 sm:w-[35%] cursor-pointer" onClick={() => setExpandedUser(isExpanded ? null : u.id)}>
                                        <div className="relative flex-shrink-0">
                                            <img src={avatar} alt="" className="w-12 h-12 rounded-xl object-cover border border-border/30 shadow-sm" />
                                            {!u.isActive && (
                                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center ring-2 ring-background">
                                                    <PowerOff className="h-2.5 w-2.5 text-white" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-[15px] truncate text-foreground">{u.name || u.email.split('@')[0]}</p>
                                                {isSelf && <span className="text-[9px] font-black uppercase tracking-widest bg-violet-500/10 text-violet-400 border border-violet-500/20 px-1.5 py-0.5 rounded-full flex-shrink-0">You</span>}
                                                {u.role === 'ADMIN' && <Crown className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />}
                                            </div>
                                            <p className="text-xs text-muted-foreground truncate mt-0.5">{u.email}</p>
                                        </div>
                                    </div>

                                    <div className="hidden lg:flex items-center justify-center flex-1">
                                        {/* Tier Badge */}
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border shadow-sm ${TIER_COLORS[u.subscriptionTier] || TIER_COLORS.FREE}`}>
                                            {TIER_LABELS[u.subscriptionTier] || u.subscriptionTier}
                                        </span>
                                    </div>

                                    {/* Mini Usage Bars */}
                                    <div className="hidden md:flex items-center gap-4 w-48 lg:w-56 cursor-pointer" onClick={() => setExpandedUser(isExpanded ? null : u.id)}>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between text-[10px] text-muted-foreground font-medium mb-1.5">
                                                <span className="flex items-center gap-1"><Coins className="h-3 w-3 text-amber-400/80" /> Tokens</span>
                                                <span className="font-bold">{u.monthlyTokenLimit === 0 ? '∞' : `${tokenPct}%`}</span>
                                            </div>
                                            <div className="h-1.5 bg-muted/40 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full transition-all ${usageColor(tokenPct)}`} style={{ width: `${u.monthlyTokenLimit === 0 ? 0 : tokenPct}%` }} />
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between text-[10px] text-muted-foreground font-medium mb-1.5">
                                                <span className="flex items-center gap-1"><FileText className="h-3 w-3 text-blue-400/80" /> Posts</span>
                                                <span className="font-bold">{u.monthlyPostLimit === 0 ? '∞' : `${postPct}%`}</span>
                                            </div>
                                            <div className="h-1.5 bg-muted/40 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full transition-all ${usageColor(postPct)}`} style={{ width: `${u.monthlyPostLimit === 0 ? 0 : postPct}%` }} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 sm:ml-auto">
                                        {!isSelf && (
                                            <>
                                                <button
                                                    onClick={() => handleToggleActive(u.id)}
                                                    disabled={loading}
                                                    title={u.isActive ? 'Disable User Account' : 'Enable User Account'}
                                                    className={`h-9 w-9 flex items-center justify-center rounded-xl border transition-all disabled:opacity-40 shadow-sm ${u.isActive
                                                        ? 'border-border/50 bg-background text-muted-foreground hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/5'
                                                        : 'border-green-500/30 bg-green-500/10 text-green-500 hover:bg-green-500/20'
                                                        }`}
                                                >
                                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : u.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                                                </button>
                                                <button
                                                    onClick={() => handleRoleToggle(u.id, u.role)}
                                                    disabled={loading}
                                                    title={u.role === 'ADMIN' ? 'Demote to User' : 'Promote to Admin'}
                                                    className={`h-9 w-9 flex items-center justify-center rounded-xl border transition-all disabled:opacity-40 shadow-sm ${
                                                        u.role === 'ADMIN' 
                                                        ? 'border-amber-500/30 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20'
                                                        : 'border-border/50 bg-background text-muted-foreground hover:text-amber-500 hover:border-amber-500/30 hover:bg-amber-500/5'
                                                    }`}
                                                >
                                                    {u.role === 'ADMIN' ? <ShieldOff className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                                                </button>
                                                <div className="w-px h-6 bg-border/50 mx-1 hidden sm:block"></div>
                                                <button
                                                    onClick={() => handleDelete(u.id, u.name || u.email)}
                                                    disabled={loading}
                                                    title="Delete User"
                                                    className="h-9 w-9 flex items-center justify-center rounded-xl border border-red-500/20 bg-red-500/5 text-red-500 hover:bg-red-500 hover:text-white transition-all disabled:opacity-40 shadow-sm"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </>
                                        )}
                                        <button
                                            onClick={() => setExpandedUser(isExpanded ? null : u.id)}
                                            title="Manage Quota Settings"
                                            className={`h-9 px-3 flex items-center gap-2 rounded-xl border transition-all shadow-sm ${
                                                isExpanded 
                                                ? 'border-violet-500/30 bg-violet-500/10 text-violet-500' 
                                                : 'border-border/50 bg-background text-muted-foreground hover:text-foreground hover:bg-surface-container-high'
                                            }`}
                                        >
                                            <Settings className="h-4 w-4" />
                                            <span className="text-xs font-bold hidden sm:inline">Settings</span>
                                            {isExpanded ? <ChevronUp className="h-4 w-4 opacity-50" /> : <ChevronDown className="h-4 w-4 opacity-50" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Expanded Quota Panel */}
                                {isExpanded && (
                                    <div className="p-5 border-t border-border/20 bg-surface-container-low/50 rounded-b-2xl animate-in slide-in-from-top-2 duration-200">
                                        <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-6">
                                            {/* Tier Selector */}
                                            <div className="bg-card p-4 rounded-xl border border-border/40 shadow-sm">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <Crown className="h-4 w-4 text-amber-500" />
                                                    <h4 className="text-xs font-black uppercase tracking-widest text-foreground">Subscription Tier</h4>
                                                </div>
                                                <p className="text-xs text-muted-foreground mb-4">Select a predefined tier or set custom limits below.</p>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {['FREE', 'PRO', 'ENTERPRISE', 'CUSTOM'].map(tier => (
                                                        <button
                                                            key={tier}
                                                            onClick={() => handleTierChange(u.id, tier)}
                                                            disabled={isPending}
                                                            className={`py-2 px-2 flex flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-bold uppercase tracking-wide border transition-all ${u.subscriptionTier === tier
                                                                ? TIER_COLORS[tier] + ' ring-2 ring-current/20 shadow-sm'
                                                                : 'border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted/10'
                                                                }`}
                                                        >
                                                            <span>{TIER_LABELS[tier].split(' ')[0]}</span>
                                                            <span>{TIER_LABELS[tier].split(' ')[1]}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Usage Stats */}
                                            <div className="bg-card p-4 rounded-xl border border-border/40 shadow-sm">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <Activity className="h-4 w-4 text-blue-500" />
                                                    <h4 className="text-xs font-black uppercase tracking-widest text-foreground">Current Usage</h4>
                                                </div>
                                                <div className="space-y-4">
                                                    <div>
                                                        <div className="flex justify-between text-xs mb-1.5">
                                                            <span className="text-muted-foreground flex items-center gap-1.5 font-medium"><Coins className="h-3.5 w-3.5 text-amber-400" /> API Tokens</span>
                                                            <span className="font-bold font-mono text-foreground">{u.tokensUsedThisMonth.toLocaleString()} / <span className="text-muted-foreground">{u.monthlyTokenLimit === 0 ? '∞' : u.monthlyTokenLimit.toLocaleString()}</span></span>
                                                        </div>
                                                        <div className="h-2.5 bg-muted/40 rounded-full overflow-hidden shadow-inner">
                                                            <div className={`h-full rounded-full transition-all duration-500 ${usageColor(tokenPct)}`} style={{ width: `${u.monthlyTokenLimit === 0 ? 0 : tokenPct}%` }} />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="flex justify-between text-xs mb-1.5">
                                                            <span className="text-muted-foreground flex items-center gap-1.5 font-medium"><FileText className="h-3.5 w-3.5 text-blue-400" /> Generated Posts</span>
                                                            <span className="font-bold font-mono text-foreground">{u.postsUsedThisMonth} / <span className="text-muted-foreground">{u.monthlyPostLimit === 0 ? '∞' : u.monthlyPostLimit}</span></span>
                                                        </div>
                                                        <div className="h-2.5 bg-muted/40 rounded-full overflow-hidden shadow-inner">
                                                            <div className={`h-full rounded-full transition-all duration-500 ${usageColor(postPct)}`} style={{ width: `${u.monthlyPostLimit === 0 ? 0 : postPct}%` }} />
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="pt-3 mt-3 border-t border-border/30 flex items-center justify-between">
                                                        <div className="text-[10px] text-muted-foreground font-medium">
                                                            <span className="block opacity-70 mb-0.5">Billing Cycle Started</span>
                                                            <span className="text-foreground">{new Date(u.currentPeriodStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                        </div>
                                                        <button
                                                            onClick={() => handleResetUsage(u.id)}
                                                            disabled={isPending}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500/20 bg-amber-500/10 text-xs font-bold text-amber-500 hover:bg-amber-500 hover:text-white disabled:opacity-40 transition-all shadow-sm"
                                                        >
                                                            <RotateCcw className="h-3 w-3" /> Reset Usage
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Custom Limits */}
                                            <div className={`bg-card p-4 rounded-xl border transition-all duration-300 shadow-sm ${u.subscriptionTier === 'CUSTOM' ? 'border-violet-500/40 ring-1 ring-violet-500/10' : 'border-border/40'}`}>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <Gauge className="h-4 w-4 text-violet-500" />
                                                    <h4 className="text-xs font-black uppercase tracking-widest text-foreground">Custom Limits</h4>
                                                </div>
                                                <p className="text-xs text-muted-foreground mb-4">Override current tier with exact limits (Set to 0 for unlimited).</p>
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex-1 space-y-1.5">
                                                            <label className="text-[10px] font-bold text-muted-foreground uppercase">Tokens / Month</label>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                value={customTokens[u.id] ?? u.monthlyTokenLimit}
                                                                onChange={e => setCustomTokens(p => ({ ...p, [u.id]: parseInt(e.target.value) || 0 }))}
                                                                className="w-full h-9 px-3 rounded-xl bg-surface-container-low border border-border/50 text-sm font-mono outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 transition-all"
                                                            />
                                                        </div>
                                                        <div className="flex-1 space-y-1.5">
                                                            <label className="text-[10px] font-bold text-muted-foreground uppercase">Posts / Month</label>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                value={customPosts[u.id] ?? u.monthlyPostLimit}
                                                                onChange={e => setCustomPosts(p => ({ ...p, [u.id]: parseInt(e.target.value) || 0 }))}
                                                                className="w-full h-9 px-3 rounded-xl bg-surface-container-low border border-border/50 text-sm font-mono outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 transition-all"
                                                            />
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleCustomQuota(u.id)}
                                                        disabled={isPending}
                                                        className="w-full flex items-center justify-center gap-2 h-9 mt-1 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all disabled:opacity-40 shadow-md shadow-violet-500/20 active:scale-95"
                                                    >
                                                        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                                                        Save Custom Limits
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </>
    )
}
