'use client'

import { useState, useTransition } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Sparkles, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'
import { Suspense } from 'react'

function SignInForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const callbackUrl = searchParams.get('callbackUrl') || '/'
    const [isPending, startTransition] = useTransition()
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState<string | null>(null)

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setError(null)
        const fd = new FormData(e.currentTarget)
        const email = fd.get('email') as string
        const password = fd.get('password') as string

        startTransition(async () => {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            })

            if (result?.error) {
                setError('Invalid email or password. Please try again.')
            } else {
                router.push(callbackUrl)
                router.refresh()
            }
        })
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#08090c]">
            {/* Ambient blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -left-40 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-500/5 rounded-full blur-3xl" />
                {/* Grid pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px] opacity-40" />
            </div>

            {/* Card */}
            <div className="relative w-full max-w-md px-4">
                <div className="rounded-3xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-2xl shadow-2xl shadow-black/40 p-8 md:p-10">

                    {/* Logo */}
                    <div className="flex flex-col items-center mb-10">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shadow-lg shadow-violet-500/30 mb-4">
                            <Sparkles className="h-8 w-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-black tracking-tight text-white">Hicham Global</h1>
                        <p className="text-sm text-white/40 mt-1 font-medium">Content Automation Engine v2.0</p>
                    </div>

                    {/* Title */}
                    <div className="mb-8 text-center">
                        <h2 className="text-xl font-black text-white">Welcome back</h2>
                        <p className="text-sm text-white/40 mt-1">Sign in to your account to continue</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Error */}
                        {error && (
                            <div className="flex items-center gap-2.5 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        {/* Email */}
                        <div className="space-y-2">
                            <label className="text-[11px] font-black uppercase tracking-widest text-white/40">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                                <input
                                    name="email"
                                    type="email"
                                    required
                                    defaultValue="hicham@admin.com"
                                    placeholder="your@email.com"
                                    className="w-full h-12 pl-11 pr-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 text-sm font-medium outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 transition-all"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <label className="text-[11px] font-black uppercase tracking-widest text-white/40">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                                <input
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    placeholder="••••••••"
                                    className="w-full h-12 pl-11 pr-12 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 text-sm font-medium outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isPending}
                            className="w-full h-12 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white font-black text-sm tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-violet-500/20 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                        >
                            {isPending ? (
                                <><Loader2 className="h-4 w-4 animate-spin" /> Signing in...</>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    <p className="text-center text-xs text-white/20 mt-8 font-medium">
                        Access is restricted to authorized users only.
                    </p>
                </div>
            </div>
        </div>
    )
}

export default function SignInPage() {
    return (
        <Suspense>
            <SignInForm />
        </Suspense>
    )
}
