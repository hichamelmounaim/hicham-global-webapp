import { getSites } from "@/app/actions/sites"
import { SitesList } from "@/components/sites-list"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function SitesPage() {
    const session = await auth()
    if (session?.user?.role !== 'ADMIN') {
        redirect('/')
    }

    const result = await getSites()
    const sites = result.success ? result.sites || [] : []

    return (
        <div className="container mx-auto py-10 max-w-4xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">WordPress Sites</h1>
                <p className="text-muted-foreground mt-2">
                    Manage your WordPress sites. Each batch can be published to a different site.
                </p>
            </div>

            <SitesList initialSites={sites} />
        </div>
    )
}
