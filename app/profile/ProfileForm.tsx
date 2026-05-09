'use client'

import { useState, useTransition } from 'react'
import { updateProfile, changePassword } from '@/app/actions/users'
import { signOut } from 'next-auth/react'
import { User, Mail, Lock, Image as ImageIcon, FileText, Save, LogOut, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

interface ProfileFormProps {
    user: {
        id: string
        name?: string | null
        email?: string | null
        bio?: string | null
        avatar?: string | null
        role: string
    }
}

export function ProfileForm({ user }: ProfileFormProps) {
    const [isPending, startTransition] = useTransition()
    const [pwPending, setPwPending] = useState(false)
    const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
    const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    function handleProfile(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        startTransition(async () => {
            try {
                await updateProfile(fd)
                setProfileMsg({ type: 'success', text: 'Profile updated successfully!' })
            } catch (err: any) {
                setProfileMsg({ type: 'error', text: err.message })
            }
            setTimeout(() => setProfileMsg(null), 4000)
        })
    }

    async function handlePassword(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        setPwPending(true)
        try {
            await changePassword(fd)
            setPwMsg({ type: 'success', text: 'Password changed successfully!' });
            (e.target as HTMLFormElement).reset()
        } catch (err: any) {
            setPwMsg({ type: 'error', text: err.message })
        }
        setPwPending(false)
        setTimeout(() => setPwMsg(null), 4000)
    }

    const avatarUrl = user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.email || 'U')}&background=7c3aed&color=fff&bold=true&size=128`

    return (
        <div className="space-y-6">
            {/* Profile Card */}
            <div className="rounded-2xl border border-border/40 bg-card p-8 space-y-6">
                {/* Avatar preview */}
                <div className="flex items-center gap-5">
                    <img src={avatarUrl} alt="Avatar" className="w-20 h-20 rounded-2xl object-cover border-2 border-violet-500/30 shadow-lg shadow-violet-500/10" />
                    <div>
                        <h2 className="text-xl font-black">{user.name || 'No name set'}</h2>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <span className={`inline-flex mt-2 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${user.role === 'ADMIN'
                            ? 'bg-violet-500/10 text-violet-400 border-violet-500/20'
                            : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                            }`}>
                            {user.role}
                        </span>
                    </div>
                </div>

                <form onSubmit={handleProfile} className="space-y-4">
                    {profileMsg && (
                        <div className={`flex items-center gap-2 text-sm rounded-xl px-4 py-3 border ${profileMsg.type === 'success'
                            ? 'bg-green-500/5 border-green-500/20 text-green-400'
                            : 'bg-red-500/5 border-red-500/20 text-red-400'
                            }`}>
                            {profileMsg.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                            {profileMsg.text}
                        </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                                <User className="h-3 w-3" /> Display Name
                            </label>
                            <input
                                name="name"
                                defaultValue={user.name || ''}
                                placeholder="Your name"
                                className="w-full h-11 px-4 rounded-xl bg-background border border-border/50 text-sm font-medium outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                                <Mail className="h-3 w-3" /> Email (read-only)
                            </label>
                            <input
                                value={user.email || ''}
                                disabled
                                className="w-full h-11 px-4 rounded-xl bg-muted/20 border border-border/30 text-sm text-muted-foreground cursor-not-allowed"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                            <ImageIcon className="h-3 w-3" /> Avatar URL
                        </label>
                        <input
                            name="avatar"
                            defaultValue={user.avatar || ''}
                            placeholder="https://example.com/avatar.jpg"
                            className="w-full h-11 px-4 rounded-xl bg-background border border-border/50 text-sm font-medium font-mono outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                            <FileText className="h-3 w-3" /> Bio
                        </label>
                        <textarea
                            name="bio"
                            defaultValue={user.bio || ''}
                            placeholder="Tell something about yourself..."
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl bg-background border border-border/50 text-sm font-medium resize-none outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 transition-all"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isPending}
                        className="flex items-center gap-2 h-11 px-6 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-black text-sm transition-all disabled:opacity-60"
                    >
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save Profile
                    </button>
                </form>
            </div>

            {/* Change Password */}
            <div className="rounded-2xl border border-border/40 bg-card p-8 space-y-4">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                        <Lock className="h-4 w-4 text-amber-400" />
                    </div>
                    <div>
                        <h3 className="font-black text-sm">Change Password</h3>
                        <p className="text-xs text-muted-foreground">Must be at least 6 characters</p>
                    </div>
                </div>

                {pwMsg && (
                    <div className={`flex items-center gap-2 text-sm rounded-xl px-4 py-3 border ${pwMsg.type === 'success'
                        ? 'bg-green-500/5 border-green-500/20 text-green-400'
                        : 'bg-red-500/5 border-red-500/20 text-red-400'
                        }`}>
                        {pwMsg.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                        {pwMsg.text}
                    </div>
                )}

                <form onSubmit={handlePassword} className="space-y-4">
                    {[
                        { name: 'currentPassword', label: 'Current Password' },
                        { name: 'newPassword', label: 'New Password' },
                        { name: 'confirmPassword', label: 'Confirm New Password' },
                    ].map(f => (
                        <div key={f.name} className="space-y-2">
                            <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">{f.label}</label>
                            <input
                                name={f.name}
                                type="password"
                                required
                                placeholder="••••••••"
                                className="w-full h-11 px-4 rounded-xl bg-background border border-border/50 text-sm font-medium outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 transition-all"
                            />
                        </div>
                    ))}
                    <button
                        type="submit"
                        disabled={pwPending}
                        className="flex items-center gap-2 h-11 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-sm transition-all disabled:opacity-60"
                    >
                        {pwPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                        Update Password
                    </button>
                </form>
            </div>

            {/* Sign out */}
            <div className="rounded-2xl border border-red-500/10 bg-red-500/[0.02] p-6 flex items-center justify-between">
                <div>
                    <p className="font-bold text-sm">Sign Out</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Sign out from all devices</p>
                </div>
                <button
                    onClick={() => signOut({ callbackUrl: '/sign-in' })}
                    className="flex items-center gap-2 h-10 px-5 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 font-bold text-sm transition-all"
                >
                    <LogOut className="h-4 w-4" /> Sign Out
                </button>
            </div>
        </div>
    )
}
