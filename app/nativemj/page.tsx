import { Suspense } from "react"
import { NativeMjClient } from "./NativeMjClient"
import { getSettings } from "@/app/actions/settings"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function NativeMjPage() {
    const session = await auth()
    if (session?.user?.role !== 'ADMIN') {
        redirect('/')
    }

    const settings = await getSettings()
    
    // Fetch initial queue data
    const tasks = await prisma.nativeMjTask.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50
    })

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter">NativeMJ Queue</h1>
                    <p className="text-sm font-medium text-foreground/60 mt-1">
                        Discord Midjourney Bot Proxy Dashboard
                    </p>
                </div>
            </div>

            <Suspense fallback={<div className="h-96 rounded-3xl bg-surface-container-high animate-pulse" />}>
                <NativeMjClient 
                    initialTasks={tasks} 
                    hasConfig={!!(settings?.nativeMjToken && settings?.nativeMjServerId && settings?.nativeMjChannelId)} 
                />
            </Suspense>
        </div>
    )
}
