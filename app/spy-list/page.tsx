import { getSpyKeywords } from "@/app/actions/spy-keywords"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import SpyListClient from "@/components/spy-list"

export const metadata = {
  title: 'Keyword Spy List | Hicham Global V2',
  description: 'Manage and track your future keyword ideas.',
}

export default async function SpyListPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/api/auth/signin')
  }

  const initialKeywords = await getSpyKeywords()

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Keyword Spy List</h2>
      </div>
      <p className="text-muted-foreground">
        Store and manage your future keyword ideas, competitor keywords, and inspiration.
      </p>

      <SpyListClient initialKeywords={initialKeywords} />
    </div>
  )
}
