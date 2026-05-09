'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"

export async function getSpyKeywords() {
    const session = await auth()
    if (!session?.user) {
        throw new Error("Unauthorized")
    }

    try {
        const keywords = await prisma.spyKeyword.findMany({
            orderBy: { createdAt: 'desc' }
        })
        return keywords
    } catch (error) {
        console.error("Failed to fetch spy keywords:", error)
        return []
    }
}

export async function addSpyKeyword(data: { keyword: string, notes?: string, source?: string, rank?: number, relatedTerms?: string }) {
    const session = await auth()
    if (!session?.user) {
        return { success: false, error: "Unauthorized" }
    }

    if (!data.keyword || data.keyword.trim() === '') {
        return { success: false, error: "Keyword is required" }
    }

    try {
        const newKeyword = await prisma.spyKeyword.create({
            data: {
                keyword: data.keyword.trim(),
                notes: data.notes || "",
                source: data.source || "manual",
                rank: data.rank || null,
                relatedTerms: data.relatedTerms || null,
            }
        })
        revalidatePath('/spy-list')
        return { success: true, keyword: newKeyword }
    } catch (error: any) {
        if (error.code === 'P2002') {
            return { success: false, error: "This keyword already exists in the list." }
        }
        console.error("Failed to add spy keyword:", error)
        return { success: false, error: "Failed to add keyword" }
    }
}

export async function updateSpyKeywordStatus(id: string, status: string) {
    const session = await auth()
    if (!session?.user) {
        return { success: false, error: "Unauthorized" }
    }

    try {
        const updated = await prisma.spyKeyword.update({
            where: { id },
            data: { status }
        })
        revalidatePath('/spy-list')
        return { success: true, keyword: updated }
    } catch (error) {
        console.error("Failed to update spy keyword status:", error)
        return { success: false, error: "Failed to update keyword status" }
    }
}

export async function deleteSpyKeyword(id: string) {
    const session = await auth()
    if (!session?.user) {
        return { success: false, error: "Unauthorized" }
    }

    try {
        await prisma.spyKeyword.delete({
            where: { id }
        })
        revalidatePath('/spy-list')
        return { success: true }
    } catch (error) {
        console.error("Failed to delete spy keyword:", error)
        return { success: false, error: "Failed to delete keyword" }
    }
}
