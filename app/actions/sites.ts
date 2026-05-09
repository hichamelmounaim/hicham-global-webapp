'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"

export async function getSites() {
    try {
        const sites = await prisma.site.findMany({
            orderBy: { createdAt: 'desc' }
        })
        return { success: true, sites }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function getSite(id: string) {
    try {
        const site = await prisma.site.findUnique({
            where: { id }
        })
        return { success: true, site }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function createSite(data: { name: string; wpUrl: string; wpUser: string; wpAppPass: string; isDefault?: boolean }) {
    const session = await auth()
    if (!session?.user) throw new Error('Not authenticated')
    try {
        // If setting as default, unset other defaults
        if (data.isDefault) {
            await prisma.site.updateMany({
                where: { isDefault: true },
                data: { isDefault: false }
            })
        }

        // Ensure URL doesn't have trailing slash
        const wpUrl = data.wpUrl.replace(/\/$/, "")

        const site = await prisma.site.create({
            data: {
                ...data,
                wpUrl
            }
        })

        revalidatePath('/sites')
        return { success: true, site }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function updateSite(id: string, data: { name?: string; wpUrl?: string; wpUser?: string; wpAppPass?: string; isDefault?: boolean }) {
    const session = await auth()
    if (!session?.user) throw new Error('Not authenticated')
    try {
        // If setting as default, unset other defaults
        if (data.isDefault) {
            await prisma.site.updateMany({
                where: {
                    isDefault: true,
                    id: { not: id }
                },
                data: { isDefault: false }
            })
        }

        // Ensure URL doesn't have trailing slash
        let wpUrl = data.wpUrl
        if (wpUrl) {
            wpUrl = wpUrl.replace(/\/$/, "")
        }

        const site = await prisma.site.update({
            where: { id },
            data: {
                ...data,
                ...(wpUrl && { wpUrl })
            }
        })

        revalidatePath('/sites')
        return { success: true, site }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function deleteSite(id: string) {
    const session = await auth()
    if (!session?.user) throw new Error('Not authenticated')
    try {
        await prisma.site.delete({
            where: { id }
        })
        revalidatePath('/sites')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function testSiteConnection(idOrUrl: string, wpUser?: string, wpAppPass?: string) {
    const session = await auth()
    if (!session?.user) throw new Error('Not authenticated')
    try {
        let url: string, user: string, pass: string

        // If only one arg, it's an ID — look up from DB
        if (!wpUser || !wpAppPass) {
            const site = await prisma.site.findUnique({ where: { id: idOrUrl } })
            if (!site) return { success: false, error: 'Site not found' }
            url = site.wpUrl
            user = site.wpUser
            pass = site.wpAppPass
        } else {
            url = idOrUrl
            user = wpUser
            pass = wpAppPass
        }

        const cleanUrl = url.replace(/\/$/, "")
        const response = await fetch(`${cleanUrl}/wp-json/wp/v2/users/me`, {
            headers: {
                'Authorization': 'Basic ' + Buffer.from(`${user}:${pass}`).toString('base64')
            }
        })

        if (response.ok) {
            const wpUser = await response.json()
            return { success: true, message: `Connected as ${wpUser.name}` }
        } else {
            return { success: false, error: `Connection failed: ${response.statusText}` }
        }
    } catch (error: any) {
        return { success: false, error: `Connection error: ${error.message}` }
    }
}

export async function fetchSitePosts(siteId: string, page: number = 1, perPage: number = 20) {
    const session = await auth()
    if (!session?.user) throw new Error('Not authenticated')
    
    try {
        const site = await prisma.site.findUnique({ where: { id: siteId } })
        if (!site) return { success: false, error: 'Site not found' }

        const cleanUrl = site.wpUrl.replace(/\/$/, "")
        const response = await fetch(`${cleanUrl}/wp-json/wp/v2/posts?page=${page}&per_page=${perPage}&_embed=1`, {
            headers: {
                'Authorization': 'Basic ' + Buffer.from(`${site.wpUser}:${site.wpAppPass}`).toString('base64')
            }
        })

        if (response.ok) {
            const posts = await response.json()
            const totalPages = parseInt(response.headers.get('x-wp-totalpages') || '1', 10)
            const total = parseInt(response.headers.get('x-wp-total') || '0', 10)
            return { success: true, posts, totalPages, total }
        } else {
            return { success: false, error: `Fetch failed: ${response.statusText}` }
        }
    } catch (error: any) {
        return { success: false, error: `Fetch error: ${error.message}` }
    }
}

export async function deleteSitePost(siteId: string, postId: number) {
    const session = await auth()
    if (!session?.user) throw new Error('Not authenticated')
    
    try {
        const site = await prisma.site.findUnique({ where: { id: siteId } })
        if (!site) return { success: false, error: 'Site not found' }

        const cleanUrl = site.wpUrl.replace(/\/$/, "")
        const response = await fetch(`${cleanUrl}/wp-json/wp/v2/posts/${postId}?force=true`, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Basic ' + Buffer.from(`${site.wpUser}:${site.wpAppPass}`).toString('base64')
            }
        })

        if (response.ok) {
            return { success: true }
        } else {
            return { success: false, error: `Delete failed: ${response.statusText}` }
        }
    } catch (error: any) {
        return { success: false, error: `Delete error: ${error.message}` }
    }
}

import { getOpenAIClient } from "@/lib/openai"

export async function analyzeSubniches(postsToAnalyze: { id: number, title: string, excerpt: string }[]) {
    const session = await auth()
    if (!session?.user) throw new Error('Not authenticated')
    
    try {
        const { client, model } = await getOpenAIClient()
        
        const prompt = `You are a professional culinary AI assistant. Categorize the following food recipes/articles into highly specific, ingredient-based food subniches. 
Instead of broad categories like "Main Courses", use specific core ingredients or distinct niches (e.g., "Salmon", "Broccoli", "Chicken Breast", "Avocado", "Matcha", "Sourdough", etc.). 
Use simple, concise, and highly targeted category names.
        
Articles:
${postsToAnalyze.map(p => `ID: ${p.id}
Title: ${p.title}
Excerpt: ${p.excerpt}`).join('\n\n')}

Return ONLY a valid JSON object mapping the post ID (as a string) to the assigned specific subniche string. Example: {"123": "Salmon", "456": "Broccoli"}`

        const completion = await client.chat.completions.create({
            model: model,
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" }
        })

        const content = completion.choices[0].message.content
        if (!content) throw new Error("No response from AI")

        const categoriesMap = JSON.parse(content)
        return { success: true, mapping: categoriesMap }
    } catch (error: any) {
        return { success: false, error: `AI Analysis error: ${error.message}` }
    }
}
