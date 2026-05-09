import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { ProfileForm } from './ProfileForm'
import { UserCircle2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Profile | Hicham Global' }

export default async function ProfilePage() {
    const session = await auth()
    if (!session?.user?.id) redirect('/sign-in')

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, name: true, email: true, bio: true, avatar: true, role: true },
    })
    if (!user) redirect('/sign-in')

    return (
        <div className="max-w-2xl space-y-8">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-400 border border-violet-500/20">
                    <UserCircle2 className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-black tracking-tight">My Profile</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">Manage your account details and security</p>
                </div>
            </div>
            <ProfileForm user={user} />
        </div>
    )
}
