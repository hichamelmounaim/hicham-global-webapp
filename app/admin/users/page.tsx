import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getUserQuotas } from '@/app/actions/admin'
import { getAllUsers } from '@/app/actions/users'
import { UsersQuotaManager } from './UsersQuotaManager'
import { ShieldCheck, Users } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'User & Quota Management | Admin | Hicham Global' }

export default async function AdminUsersPage() {
    const session = await auth()
    if (!session?.user) redirect('/sign-in')
    if (session.user.role !== 'ADMIN') redirect('/')

    const users = await getUserQuotas()

    return (
        <div className="max-w-6xl space-y-8">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-violet-500/20">
                    <Users className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-black tracking-tight">Users & Subscriptions</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        {users.length} account{users.length !== 1 ? 's' : ''} · Manage access, quotas & usage
                    </p>
                </div>
            </div>

            <UsersQuotaManager users={users as any} currentUserId={session.user.id} />
        </div>
    )
}
