'use client'

import { useState, useTransition } from 'react'
import { deleteUser, updateUserRole, createUser } from '@/app/actions/users'
import { Trash2, ShieldCheck, ShieldOff, UserPlus, Loader2, X, CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface User { id: string; name: string | null; email: string; role: string; avatar: string | null; createdAt: Date }

export function UserTable({ users, currentUserId }: { users: User[]; currentUserId: string }) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [showCreate, setShowCreate] = useState(false)
    const [createMsg, setCreateMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
    const [actionId, setActionId] = useState<string | null>(null)

    function handleDelete(id: string, name: string) {
        if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return
        setActionId(id)
        startTransition(async () => {
            try { await deleteUser(id); router.refresh() }
            catch (e: any) { alert(e.message) }
            finally { setActionId(null) }
        })
    }

    function handleRoleToggle(id: string, currentRole: string) {
        const next = currentRole === 'ADMIN' ? 'USER' : 'ADMIN'
        setActionId(id)
        startTransition(async () => {
            try { await updateUserRole(id, next as any); router.refresh() }
            catch (e: any) { alert(e.message) }
            finally { setActionId(null) }
        })
    }

    async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        try {
            await createUser(fd);
            (e.target as HTMLFormElement).reset()
            setCreateMsg({ type: 'success', text: 'User created successfully!' })
            router.refresh()
            setTimeout(() => { setCreateMsg(null); setShowCreate(false) }, 2000)
        } catch (err: any) {
            setCreateMsg({ type: 'error', text: err.message })
        }
    }

    return (
        <div className="space-y-4">
            {/* Create user button */}
            <div className="flex justify-end">
                <button
                    onClick={() => setShowCreate(!showCreate)}
                    className="flex items-center gap-2 h-10 px-5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm transition-all"
                >
                    {showCreate ? <X className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                    {showCreate ? 'Cancel' : 'Create User'}
                </button>
            </div>

            {/* Create form */}
            {showCreate && (
                <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-6 space-y-4">
                    <h3 className="font-black text-sm uppercase tracking-widest text-violet-400">New User</h3>
                    {createMsg && (
                        <div className={`flex items-center gap-2 text-sm rounded-xl px-3 py-2 border ${createMsg.type === 'success' ? 'bg-green-500/5 border-green-500/20 text-green-400' : 'bg-red-500/5 border-red-500/20 text-red-400'}`}>
                            {createMsg.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : null}
                            {createMsg.text}
                        </div>
                    )}
                    <form onSubmit={handleCreate} className="grid md:grid-cols-2 gap-4">
                        <input name="name" placeholder="Full name" className="h-10 px-3 rounded-xl bg-background border border-border/50 text-sm font-medium outline-none focus:border-violet-500/60 transition-all" />
                        <input name="email" type="email" required placeholder="email@example.com" className="h-10 px-3 rounded-xl bg-background border border-border/50 text-sm font-medium outline-none focus:border-violet-500/60 transition-all" />
                        <input name="password" type="password" required placeholder="Password (min 6 chars)" className="h-10 px-3 rounded-xl bg-background border border-border/50 text-sm font-medium outline-none focus:border-violet-500/60 transition-all" />
                        <select name="role" className="h-10 px-3 rounded-xl bg-background border border-border/50 text-sm font-medium outline-none focus:border-violet-500/60 transition-all">
                            <option value="USER">User</option>
                            <option value="ADMIN">Admin</option>
                        </select>
                        <div className="md:col-span-2">
                            <button type="submit" className="flex items-center gap-2 h-10 px-6 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-black text-sm transition-all">
                                <UserPlus className="h-4 w-4" /> Create Account
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Users Table */}
            <div className="rounded-2xl border border-border/40 bg-card overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border/40 bg-muted/20">
                            {['User', 'Role', 'Joined', 'Actions'].map(h => (
                                <th key={h} className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                        {users.map(u => {
                            const avatar = u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || u.email)}&background=7c3aed&color=fff&bold=true&size=64`
                            const isSelf = u.id === currentUserId
                            const loading = actionId === u.id && isPending

                            return (
                                <tr key={u.id} className="hover:bg-muted/10 transition-colors">
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <img src={avatar} alt="" className="w-9 h-9 rounded-xl object-cover border border-border/30" />
                                            <div>
                                                <p className="font-bold">{u.name || '—'}</p>
                                                <p className="text-xs text-muted-foreground">{u.email}</p>
                                            </div>
                                            {isSelf && <span className="text-[9px] font-black uppercase tracking-widest bg-violet-500/10 text-violet-400 border border-violet-500/20 px-2 py-0.5 rounded-full">You</span>}
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className={`inline-flex text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${u.role === 'ADMIN'
                                            ? 'bg-violet-500/10 text-violet-400 border-violet-500/20'
                                            : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                                            }`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-xs text-muted-foreground font-mono">
                                        {new Date(u.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-2">
                                            {!isSelf && (
                                                <>
                                                    <button
                                                        onClick={() => handleRoleToggle(u.id, u.role)}
                                                        disabled={loading}
                                                        title={u.role === 'ADMIN' ? 'Demote to User' : 'Promote to Admin'}
                                                        className="flex items-center gap-1 h-7 px-2.5 rounded-lg border border-border/40 text-muted-foreground hover:text-foreground hover:border-violet-500/40 text-xs font-bold transition-all disabled:opacity-40"
                                                    >
                                                        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : u.role === 'ADMIN' ? <ShieldOff className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3" />}
                                                        {u.role === 'ADMIN' ? 'Demote' : 'Promote'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(u.id, u.name || u.email)}
                                                        disabled={loading}
                                                        className="h-7 w-7 flex items-center justify-center rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-40"
                                                    >
                                                        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
