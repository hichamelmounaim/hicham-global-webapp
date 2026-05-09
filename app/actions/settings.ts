'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"

const MASK = '••••••••'

function maskKey(key: string | null | undefined): string | null {
    if (!key || key.trim() === '') return null
    if (key.length <= 6) return MASK
    return MASK + key.slice(-4)
}

function isMasked(val: string | null): boolean {
    return !!val && val.startsWith(MASK)
}

export async function getSettings() {
    const session = await auth()
    if (!session?.user) throw new Error('Not authenticated')
    const settings = await prisma.settings.findFirst()
    if (!settings) return null

    // Mask sensitive keys before sending to the client
    return {
        ...settings,
        openaiKey: maskKey(settings.openaiKey),
        openRouterKey: maskKey(settings.openRouterKey),
        goapiKey: maskKey(settings.goapiKey),
        ttapiKey: maskKey(settings.ttapiKey),
        linkrApiKey: maskKey(settings.linkrApiKey),
        nativeMjToken: maskKey(settings.nativeMjToken),
        wpAppPass: maskKey(settings.wpAppPass),
    }
}

export async function updateSettings(formData: FormData) {
    const session = await auth()
    if (!session?.user) throw new Error('Not authenticated')

    const openaiKey = formData.get("openaiKey") as string
    const openRouterKey = formData.get("openRouterKey") as string
    const aiModel = formData.get("aiModel") as string
    const goapiKey = formData.get("goapiKey") as string
    const ttapiKey = formData.get("ttapiKey") as string
    const linkrApiKey = formData.get("linkrApiKey") as string
    const nativeMjToken = formData.get("nativeMjToken") as string
    const nativeMjServerId = formData.get("nativeMjServerId") as string
    const nativeMjChannelId = formData.get("nativeMjChannelId") as string
    const nativeMjBannedKeywords = formData.get("nativeMjBannedKeywords") as string
    const imageProvider = formData.get("imageProvider") as string
    const wpUrl = formData.get("wpUrl") as string
    const wpUser = formData.get("wpUser") as string
    const wpAppPass = formData.get("wpAppPass") as string
    const authorBio = formData.get("authorBio") as string
    const expertPersona = formData.get("expertPersona") as string
    const promptGroups = formData.get("promptGroups") as string

    // Build update data, skipping masked values (user didn't change them)
    const data: Record<string, any> = {
        aiModel,
        imageProvider,
        nativeMjServerId,
        nativeMjChannelId,
        nativeMjBannedKeywords,
        wpUrl,
        wpUser,
        authorBio,
        expertPersona,
        promptGroups,
    }

    // Only update keys if user provided a new (non-masked) value
    if (!isMasked(openaiKey)) data.openaiKey = openaiKey
    if (!isMasked(openRouterKey)) data.openRouterKey = openRouterKey
    if (!isMasked(goapiKey)) data.goapiKey = goapiKey
    if (!isMasked(ttapiKey)) data.ttapiKey = ttapiKey
    if (!isMasked(linkrApiKey)) data.linkrApiKey = linkrApiKey
    if (!isMasked(nativeMjToken)) data.nativeMjToken = nativeMjToken
    if (!isMasked(wpAppPass)) data.wpAppPass = wpAppPass

    await prisma.settings.upsert({
        where: { id: 1 },
        update: data,
        create: { id: 1, ...data },
    })

    revalidatePath("/settings")
    return { success: true }
}

export async function updatePromptGroups(promptGroupsJson: string) {
    const session = await auth()
    if (!session?.user) throw new Error('Not authenticated')
    await prisma.settings.upsert({
        where: { id: 1 },
        update: { promptGroups: promptGroupsJson },
        create: { id: 1, promptGroups: promptGroupsJson },
    })
    revalidatePath("/settings")
    return { success: true }
}
