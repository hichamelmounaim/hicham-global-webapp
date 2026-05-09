'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { getSettings } from "./settings"

// Helper to interact with Discord API
async function discordApiRequest(endpoint: string, method: string, token: string, body?: any) {
    const res = await fetch(`https://discord.com/api/v9${endpoint}`, {
        method,
        headers: {
            'Authorization': token,
            'Content-Type': 'application/json'
        },
        body: body ? JSON.stringify(body) : undefined
    })
    
    if (!res.ok) {
        const err = await res.text()
        throw new Error(`Discord API Error: ${res.status} - ${err}`)
    }
    
    if (res.status === 204) return null
    return res.json()
}

export async function addNativeMjTask(prompt: string) {
    const session = await auth()
    if (!session?.user) throw new Error('Not authenticated')

    const settings = await getSettings()
    if (!settings) throw new Error('Settings not configured')

    // Check banned keywords
    if (settings.nativeMjBannedKeywords) {
        const banned = settings.nativeMjBannedKeywords.split(',').map(k => k.trim().toLowerCase()).filter(k => k)
        const promptLower = prompt.toLowerCase()
        for (const word of banned) {
            if (promptLower.includes(word)) {
                throw new Error(`Prompt contains banned keyword: ${word}`)
            }
        }
    }

    const task = await prisma.nativeMjTask.create({
        data: {
            prompt,
            status: 'QUEUED'
        }
    })

    revalidatePath("/nativemj")
    return task
}

export async function getNativeMjTasks() {
    return prisma.nativeMjTask.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100
    })
}

export async function clearNativeMjQueue() {
    const session = await auth()
    if (!session?.user) throw new Error('Not authenticated')
    
    await prisma.nativeMjTask.deleteMany({})
    revalidatePath("/nativemj")
    return { success: true }
}

// Get user ID from token
async function getDiscordUserId(token: string) {
    const data = await discordApiRequest('/users/@me', 'GET', token)
    return data.id
}

// Drive the queue
export async function processNativeMjQueue() {
    const settings = await prisma.settings.findFirst()
    if (!settings?.nativeMjToken || !settings?.nativeMjServerId || !settings?.nativeMjChannelId) {
        return { success: false, error: 'Discord credentials missing' }
    }

    const { nativeMjToken: token, nativeMjServerId: guildId, nativeMjChannelId: channelId } = settings

    try {
        // 1. Get currently processing tasks
        const processingTasks = await prisma.nativeMjTask.findMany({
            where: { status: 'PROCESSING' }
        })

        const activeCount = processingTasks.length

        // 2. Poll messages to check for completion of processing tasks
        if (activeCount > 0) {
            try {
                const userId = await getDiscordUserId(token)
                const messages = await discordApiRequest(`/channels/${channelId}/messages?limit=50`, 'GET', token)
                
                for (const task of processingTasks) {
                    // Find a message from Midjourney bot mentioning the user and containing the prompt
                    const botMessage = messages.find((m: any) => 
                        m.author.id === '936929561302675456' && // Midjourney Bot
                        m.content.includes(`<@${userId}>`) &&
                        // Basic prompt matching. Discord might truncate or change formatting.
                        // We do a loose check.
                        task.prompt.split(' ').slice(0, 3).every((word: string) => m.content.toLowerCase().includes(word.toLowerCase()))
                    )

                    if (botMessage) {
                        const isFinished = botMessage.attachments && botMessage.attachments.length > 0 && !botMessage.content.includes('(Waiting to start)') && !botMessage.content.includes('%')
                        
                        if (isFinished) {
                            await prisma.nativeMjTask.update({
                                where: { id: task.id },
                                data: {
                                    status: 'COMPLETED',
                                    imageUrl: botMessage.attachments[0].url,
                                    messageId: botMessage.id
                                }
                            })
                        }
                    }
                }
            } catch (err: any) {
                console.error("Error polling discord messages", err)
            }
        }

        // 3. Start new tasks if we have capacity (max 3 concurrent)
        const updatedProcessingTasks = await prisma.nativeMjTask.count({ where: { status: 'PROCESSING' } })
        const slotsAvailable = 3 - updatedProcessingTasks

        if (slotsAvailable > 0) {
            const queuedTasks = await prisma.nativeMjTask.findMany({
                where: { status: 'QUEUED' },
                orderBy: { createdAt: 'asc' },
                take: slotsAvailable
            })

            for (const task of queuedTasks) {
                // Send /imagine command
                try {
                    const payload = {
                        type: 2,
                        application_id: '936929561302675456',
                        guild_id: guildId,
                        channel_id: channelId,
                        session_id: "nativemj_" + task.id.replace(/-/g, '').substring(0, 16),
                        data: {
                            version: "1118961510123847772",
                            id: "938956540159881230",
                            name: "imagine",
                            type: 1,
                            options: [
                                {
                                    type: 3,
                                    name: "prompt",
                                    value: task.prompt
                                }
                            ]
                        }
                    }

                    await discordApiRequest('/interactions', 'POST', token, payload)

                    await prisma.nativeMjTask.update({
                        where: { id: task.id },
                        data: { status: 'PROCESSING' }
                    })
                } catch (err: any) {
                    await prisma.nativeMjTask.update({
                        where: { id: task.id },
                        data: { status: 'FAILED', error: err.message || 'Failed to submit' }
                    })
                }
            }
        }

        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}
