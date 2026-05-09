import { getSettings } from "@/app/actions/settings"
import { SettingsForm } from "@/components/settings-form"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function SettingsPage() {
    const session = await auth()
    if (session?.user?.role !== 'ADMIN') {
        redirect('/')
    }

    const settings = await getSettings()

    return (
        <div className="w-full space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                    Configure API keys, AI prompts, and connected WordPress sites.
                </p>
            </div>

            <SettingsForm initialSettings={settings} />
        </div>
    )
}
