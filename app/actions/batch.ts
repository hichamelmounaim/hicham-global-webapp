'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"

export async function createBatch(formData: FormData) {
    const session = await auth()
    if (!session?.user) throw new Error('Not authenticated')
    const name = formData.get("name") as string
    const keywordsRaw = formData.get("keywords") as string
    const siteId = formData.get("siteId") as string

    if (!name || !keywordsRaw) {
        throw new Error("Missing name or keywords")
    }

    if (!siteId) {
        throw new Error("Please select a WordPress site")
    }

    // Split keywords by new line
    const keywords = keywordsRaw
        .split("\n")
        .map((k) => k.trim())
        .filter((k) => k.length > 0)

    if (keywords.length === 0) {
        throw new Error("No valid keywords found")
    }

    // Create Batch and Posts in a transaction
    const batch = await prisma.batch.create({
        data: {
            name,
            siteId,
            posts: {
                create: keywords.map((k) => ({
                    keyword: k,
                    status: "QUEUED",
                })),
            },
        },
    })

    revalidatePath("/")
    revalidatePath("/projects")
    redirect(`/projects/${batch.id}`)
}

export async function deleteBatch(id: string) {
    const session = await auth()
    if (!session?.user) throw new Error('Not authenticated')
    try {
        await prisma.batch.delete({
            where: { id }
        })
        revalidatePath("/")
        revalidatePath("/projects")
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
