import { getSites } from "@/app/actions/sites"
import { FetchArticlesClient } from "./FetchArticlesClient"

export const metadata = {
    title: "Fetch Site Articles",
}
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function FetchSitePage() {
    const session = await auth()
    if (session?.user?.role !== 'ADMIN') {
        redirect('/')
    }

    const { sites } = await getSites()

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Page Header */}
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-black tracking-tight text-foreground font-display uppercase italic">
                    Fetch <span className="text-primary">Articles</span>
                </h1>
                <p className="text-foreground/40 font-medium text-sm">
                    Retrieve and explore articles directly from your connected WordPress nodes.
                </p>
            </div>

            <FetchArticlesClient initialSites={sites || []} />
        </div>
    )
}
