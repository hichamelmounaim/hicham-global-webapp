'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
    LayoutDashboard,
    FolderKanban,
    FileText,
    Globe,
    Activity,
    Layers,
    Settings,
    Sparkles,
    UserCircle2,
    Menu,
    X,
    BarChart2,
    Zap,
    ShieldCheck,
    LogOut,
    BookOpen,
    Crosshair,
    Database,
    Download,
    Bot,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { ThemeToggle } from './theme-toggle'

const navItems = [
    { href: '/', label: 'Home', icon: LayoutDashboard, exact: true },
    { href: '/projects', label: 'Projects', icon: FolderKanban },
    { href: '/posts', label: 'Articles', icon: FileText },
    { href: '/pillar', label: 'Pillar', icon: Layers },
    { href: '/campaigns', label: 'Campaigns', icon: Zap },
    { href: '/spy-list', label: 'Spy List', icon: Crosshair },
    { href: '/sites', label: 'Sites', icon: Globe, exact: true, adminOnly: true },
    { href: '/sites/fetch', label: 'Fetch Site', icon: Database, adminOnly: true },
    { href: '/nativemj', label: 'Native MJ', icon: Bot, adminOnly: true },
    { href: '/analytics', label: 'Analytics', icon: BarChart2, adminOnly: true },
    { href: '/docs', label: 'Docs', icon: BookOpen },
    { href: '/settings', label: 'Settings', icon: Settings, adminOnly: true },
]

export function Sidebar() {
    const pathname = usePathname()
    const [isScrolled, setIsScrolled] = useState(false)
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const { data: session } = useSession()

    const isAdmin = session?.user?.role === 'ADMIN'
    const userName = session?.user?.name || session?.user?.email?.split('@')[0] || 'User'
    const userRole = session?.user?.role || 'USER'
    const avatarUrl = (session?.user as any)?.image ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=7c3aed&color=fff&bold=true&size=64`

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 10)
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const isActive = (href: string, exact = false) => {
        if (exact) return pathname === href
        return pathname === href || pathname.startsWith(href + '/')
    }

    const NavLink = ({ item, onClick }: { item: typeof navItems[0]; onClick?: () => void }) => {
        const active = isActive(item.href, item.exact)
        const Icon = item.icon
        return (
            <Link
                href={item.href}
                onClick={onClick}
                className={`relative group flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${active
                    ? 'text-primary'
                    : 'text-foreground/50 hover:text-foreground hover:bg-surface-container-high'
                    }`}
            >
                {active && (
                    <motion.div
                        layoutId="active-pill-desktop"
                        className="absolute inset-0 bg-primary/10 rounded-xl border border-primary/20"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                )}
                <Icon className={`h-4.5 w-4.5 flex-shrink-0 z-10 ${active ? 'text-primary' : 'group-hover:scale-110 transition-transform'}`} />
                <span className="z-10">{item.label}</span>
                {active && (
                    <motion.div
                        layoutId="active-indicator-desktop"
                        className="absolute left-0 w-1 h-4 bg-primary rounded-r-full"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                )}
            </Link>
        )
    }

    return (
        <>
            {/* ══════════════════════════════ DESKTOP SIDEBAR ══════════════════════════════ */}
            <aside className="hidden lg:flex fixed left-0 top-0 h-full w-56 flex-col z-40 bg-surface-container-low border-r border-outline-variant/10">
                {/* Logo */}
                <div className="p-6">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform duration-300">
                            <Sparkles className="h-5 w-5 text-on-primary font-bold" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-black tracking-tight text-foreground uppercase">Hicham Global</span>
                            <span className="text-[10px] text-primary font-bold tracking-widest uppercase opacity-80">v2.0</span>
                        </div>
                    </Link>
                </div>

                {/* Main Nav */}
                <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
                    {navItems.filter(item => isAdmin || !item.adminOnly).map((item) => <NavLink key={item.href} item={item} />)}

                    {/* Admin section */}
                    {isAdmin && (
                        <>
                            <div className="pt-4 pb-1 px-4">
                                <p className="text-[9px] font-black uppercase tracking-widest text-violet-400/60">Admin Panel</p>
                            </div>
                            {[
                                { href: '/admin', label: 'Dashboard', icon: ShieldCheck, exact: true },
                                { href: '/admin/users', label: 'Users & Quotas', icon: ShieldCheck },
                                { href: '/admin/sites', label: 'Sites', icon: Globe },
                                { href: '/logs', label: 'Activity Logs', icon: Activity },
                            ].map(item => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`relative group flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${isActive(item.href, item.exact)
                                        ? 'text-violet-400 bg-violet-500/10 border border-violet-500/20'
                                        : 'text-foreground/50 hover:text-foreground hover:bg-surface-container-high'
                                        }`}
                                >
                                    <item.icon className="h-4 w-4 z-10 text-violet-400" />
                                    <span className="z-10">{item.label}</span>
                                </Link>
                            ))}
                        </>
                    )}
                </nav>

                {/* Download Plugin Card */}
                <div className="px-4 pb-4">
                    <a 
                        href="/downloads/hicham-global-bridge.zip"
                        download
                        className="block w-full p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 hover:border-primary/40 hover:bg-primary/10 transition-all group shadow-sm"
                    >
                        <div className="flex items-center gap-2 mb-1.5 text-primary">
                            <Download className="h-4 w-4 group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] font-black uppercase tracking-widest">WP Bridge</span>
                        </div>
                        <p className="text-[9px] text-foreground/60 font-bold leading-tight">
                            Download the required plugin for your target WordPress sites.
                        </p>
                    </a>
                </div>

                {/* User Footer */}
                <div className="p-4">
                    <div className="rounded-2xl bg-surface-container-high border border-outline-variant/10 p-3 space-y-3">
                        {/* User info */}
                        <Link href="/profile" className="flex items-center gap-3 group">
                            <img
                                src={avatarUrl}
                                alt={userName}
                                className="w-9 h-9 rounded-xl object-cover border border-white/10 group-hover:border-violet-500/40 transition-colors"
                            />
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-black truncate text-foreground group-hover:text-violet-400 transition-colors">{userName}</p>
                                <p className={`text-[10px] font-bold uppercase tracking-wider ${userRole === 'ADMIN' ? 'text-violet-400' : 'text-cyan-400'}`}>
                                    {userRole}
                                </p>
                            </div>
                            <UserCircle2 className="h-4 w-4 text-muted-foreground/30 group-hover:text-violet-400 transition-colors flex-shrink-0" />
                        </Link>
                        
                        <div className="pt-2 border-t border-outline-variant/10">
                            <ThemeToggle />
                        </div>

                        {/* Sign out */}
                        <button
                            onClick={() => signOut({ callbackUrl: '/sign-in' })}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-red-400 hover:bg-red-500/5 transition-all"
                        >
                            <LogOut className="h-3.5 w-3.5" /> Sign Out
                        </button>
                    </div>
                </div>
            </aside>

            {/* ══════════════════════════════ MOBILE NAVIGATION ══════════════════════════════ */}
            <div className="lg:hidden">
                {/* Mobile Top Bar */}
                <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-4 h-16 flex items-center justify-between border-b ${isScrolled ? 'bg-background/80 backdrop-blur-xl border-outline-variant/10 shadow-lg' : 'bg-transparent border-transparent'
                    }`}>
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-container flex items-center justify-center shadow-lg shadow-primary/20">
                            <Sparkles className="h-4 w-4 text-on-primary shadow-sm" />
                        </div>
                        <span className="text-xs font-black tracking-tight text-foreground uppercase">Hicham Global</span>
                    </Link>
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="p-2 rounded-xl bg-surface-container-high border border-outline-variant/10 text-foreground active:scale-90 transition-transform"
                    >
                        {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </header>

                {/* Mobile Drawer */}
                <AnimatePresence>
                    {isMenuOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                onClick={() => setIsMenuOpen(false)}
                                className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40"
                            />
                            <motion.div
                                initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                className="fixed right-0 top-0 bottom-0 w-64 bg-surface-container-low border-l border-outline-variant/10 z-50 p-6 flex flex-col"
                            >
                                <div className="flex-1 space-y-4 overflow-y-auto">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">Menu</p>
                                    <div className="grid gap-2">
                                        {navItems.filter(item => isAdmin || !item.adminOnly).map((item) => (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                onClick={() => setIsMenuOpen(false)}
                                                className={`flex items-center gap-3 p-3 rounded-xl text-sm font-bold transition-all ${isActive(item.href, item.exact)
                                                    ? 'bg-primary/10 text-primary border border-primary/20'
                                                    : 'hover:bg-surface-container-high text-foreground/70'
                                                    }`}
                                            >
                                                <item.icon className="h-4.5 w-4.5" />
                                                {item.label}
                                            </Link>
                                        ))}
                                        {isAdmin && (
                                            <>
                                                <div className="pt-2 pb-1 px-1">
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-violet-400/60">Admin Panel</p>
                                                </div>
                                                {[
                                                    { href: '/admin', label: 'Dashboard' },
                                                    { href: '/admin/users', label: 'Users & Quotas' },
                                                    { href: '/admin/sites', label: 'Sites' },
                                                    { href: '/logs', label: 'Activity Logs' },
                                                ].map(item => (
                                                    <Link
                                                        key={item.href}
                                                        href={item.href}
                                                        onClick={() => setIsMenuOpen(false)}
                                                        className={`flex items-center gap-3 p-3 rounded-xl text-sm font-bold transition-all ${isActive(item.href, item.href === '/admin')
                                                            ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
                                                            : 'hover:bg-surface-container-high text-violet-400/60'
                                                            }`}
                                                    >
                                                        <ShieldCheck className="h-4.5 w-4.5" />
                                                        {item.label}
                                                    </Link>
                                                ))}
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Mobile Download Plugin Card */}
                                <div className="px-1 py-4">
                                    <a 
                                        href="/downloads/hicham-global-bridge.zip"
                                        download
                                        className="block w-full p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 hover:border-primary/40 hover:bg-primary/10 transition-all group shadow-sm"
                                    >
                                        <div className="flex items-center gap-2 mb-1.5 text-primary">
                                            <Download className="h-4 w-4 group-hover:scale-110 transition-transform" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">WP Bridge</span>
                                        </div>
                                        <p className="text-[9px] text-foreground/60 font-bold leading-tight">
                                            Download the required plugin for your target WordPress sites.
                                        </p>
                                    </a>
                                </div>

                                <div className="pt-6 border-t border-outline-variant/10 space-y-2">
                                    <Link href="/profile" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container-high transition-all">
                                        <img src={avatarUrl} alt="" className="w-8 h-8 rounded-lg object-cover border border-white/10" />
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold truncate">{userName}</p>
                                            <p className={`text-[10px] font-bold uppercase ${userRole === 'ADMIN' ? 'text-violet-400' : 'text-cyan-400'}`}>{userRole}</p>
                                        </div>
                                    </Link>
                                    <div className="px-1 py-1">
                                        <ThemeToggle />
                                    </div>
                                    <button
                                        onClick={() => signOut({ callbackUrl: '/sign-in' })}
                                        className="w-full flex items-center gap-2 p-3 rounded-xl text-sm font-bold text-red-400 hover:bg-red-500/5 transition-all"
                                    >
                                        <LogOut className="h-4 w-4" /> Sign Out
                                    </button>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                {/* Mobile Bottom Tab Bar */}
                <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-2xl border-t border-outline-variant/10 h-20 px-4">
                    <div className="flex items-center justify-around h-full max-w-md mx-auto">
                        {navItems.slice(0, 4).map((item) => {
                            const active = isActive(item.href, item.exact)
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`relative flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 ${active ? 'text-primary' : 'text-foreground/40'}`}
                                >
                                    {active && (
                                        <motion.div
                                            layoutId="active-tab-mobile"
                                            className="absolute inset-0 bg-primary/10 rounded-2xl border border-primary/20"
                                            transition={{ type: 'spring', bounce: 0.3, duration: 0.6 }}
                                        />
                                    )}
                                    <item.icon className={`h-5 w-5 mb-1 z-10 ${active ? 'scale-110' : 'scale-100'} transition-transform`} />
                                    <span className="text-[9px] font-black z-10 text-center">{item.label}</span>
                                </Link>
                            )
                        })}
                        <button
                            onClick={() => setIsMenuOpen(true)}
                            className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl text-foreground/40"
                        >
                            <Menu className="h-5 w-5 mb-1" />
                            <span className="text-[9px] font-black">More</span>
                        </button>
                    </div>
                </nav>
            </div>
        </>
    )
}
