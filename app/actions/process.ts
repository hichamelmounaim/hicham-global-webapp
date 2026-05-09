'use server'

import { prisma } from "@/lib/prisma"
import {
    generateTitleAndMeta,
    generateIntro,
    generateBodyOutline,
    generateBody,
    generateConclusion,
    generateExpertBlock,
    generatePersonalBlock,
    generateSocialBlocks
} from "@/lib/workflow/generator"
import { midjourneyImagine, checkMidjourneyTask } from "@/lib/goapi"
import { publishToWordPress } from "@/lib/wordpress"
import { revalidatePath } from "next/cache"

export async function processPostStep(postId: string) {
    const post = await prisma.post.findUnique({
        where: { id: postId },
    })

    if (!post) throw new Error("Post not found")
    if (post.status === "DONE" || post.status === "ERROR") return { done: true }

    try {
        let content = post.content ? JSON.parse(post.content) : {}
        let nextStep = post.step
        let status = post.status

        // Step 0: Start -> Generate Title & Meta
        if (nextStep === 0) {
            status = "GENERATING_TITLES"
            await log(postId, "Starting generation...", "INFO")
            const titleMeta = await generateTitleAndMeta(post.keyword)
            content = { ...content, ...titleMeta }
            nextStep = 1
            await log(postId, `Generated Title: ${titleMeta.title}`, "SUCCESS")
        }

        // Step 1: Title Done -> Generate Content
        else if (nextStep === 1) {
            status = "GENERATING_CONTENT"
            await log(postId, "Generating Body Content...", "INFO")

            const settings = await prisma.settings.findFirst()
            const bio = settings?.authorBio || "Eleanor Royal is a home cook from the Midwest who’s been perfecting cozy, approachable recipes for over 20 years."
            const expertPersona = settings?.expertPersona || "A culinary expert or food scientist."

            const intro = await generateIntro(post.keyword, content, bio)
            content.intro = intro

            const outlineData = await generateBodyOutline(post.keyword, content)
            content.outline = outlineData.outline

            // For now use a generic ingredients string if not in recipeData
            const recipeData = post.recipeData ? JSON.parse(post.recipeData) : null
            const ingredientsList = recipeData?.ingredients?.join(", ") || "Flour, Sugar, Eggs, Milk, Butter"

            const body = await generateBody(post.keyword, content, content.outline, ingredientsList)
            content.body = body

            const conclusion = await generateConclusion(post.keyword, content, bio)
            content.conclusion = conclusion

            // New Specialized Blocks
            await log(postId, "Generating Specialized Blocks...", "INFO")
            const expertContent = await generateExpertBlock(post.keyword, content.title, expertPersona)
            const personalContent = await generatePersonalBlock(post.keyword, content.title, bio)
            const socialContent = await generateSocialBlocks(post.keyword, content)

            nextStep = 2 // Move to images
            await log(postId, "Generated full article content and specialized blocks", "SUCCESS")

            // Update with the new specific fields
            await prisma.post.update({
                where: { id: postId },
                data: {
                    expertContent,
                    personalContent,
                    socialContent: JSON.stringify(socialContent),
                }
            })
        }

        // Step 2: Content Done -> Generate Images
        else if (nextStep === 2) {
            status = "GENERATING_IMAGES"

            if (!content.imageTaskId) {
                // Fetch Prompt Groups
                const settings = await prisma.settings.findFirst()
                let featureImagePrompt = "Professional food photography of {keyword}, natural lighting, 8k."
                if (settings?.promptGroups) {
                    try {
                        const pg = JSON.parse(settings.promptGroups)
                        const active = pg.groups.find((g: any) => g.id === pg.activeGroup) || pg.groups[0]
                        if (active?.featureImagePrompt) {
                            featureImagePrompt = active.featureImagePrompt
                        }
                    } catch { }
                }

                await log(postId, "Starting Image Generation (Midjourney)...", "INFO")
                // Inject the keyword into the custom prompt
                const prompt = featureImagePrompt.replace(/{keyword}/gi, post.keyword).replace(/{title}/gi, content.title || post.keyword)
                
                const task = await midjourneyImagine(prompt)
                content.imageTaskId = task.data.task_id
                await log(postId, `Task Started: ${task.data.task_id}`, "INFO")
            } else {
                // Check status
                const check = await checkMidjourneyTask(content.imageTaskId)
                if (check.data.status === "completed" || check.data.status === "success") {
                    content.imageUrl = check.data.image_url // or output.image_url
                    await log(postId, "Image Generation Complete", "SUCCESS")
                    nextStep = 3 // Move to publish
                } else if (check.data.status === "failed") {
                    await log(postId, "Image Generation Failed", "ERROR")
                    // decide whether to retry or skip. For now, skip to publish without image.
                    nextStep = 3
                } else {
                    // Still processing (pending/running)
                }
            }
        }

        // Step 3: Images Done -> Publish to WP
        else if (nextStep === 3) {
            status = "PUBLISHING"
            await log(postId, "Assembling content and publishing to WordPress...", "INFO")

            // Get Settings & Site
            const settings = await prisma.settings.findFirst()
            const postWithSite = await prisma.post.findUnique({
                where: { id: postId },
                include: { batch: { include: { site: true } } }
            })

            const site = postWithSite?.batch?.site || (await prisma.site.findFirst({ where: { isDefault: true } }))

            if (!site) {
                throw new Error("No WordPress site configured for this batch")
            }

            // Assemble HTML with New Blocks
            const postData = await prisma.post.findUnique({ where: { id: postId } })

            let fullHtml = `
                <div class="article-intro">${content.intro}</div>
                ${postData?.expertContent || ""}
            `

            // Insert Ingredients image if it exists
            if (post.ingredientsImageUrl) {
                fullHtml += `
                    <figure class="wp-block-image size-large">
                        <img src="${post.ingredientsImageUrl}" alt="Ingredients for ${post.keyword}" />
                    </figure>
                `
            }

            fullHtml += `
                <div class="article-body">${content.body}</div>
                ${postData?.personalContent || ""}
            `

            // Insert Final Dish image if it exists
            if (post.finalDishImageUrl) {
                fullHtml += `
                    <figure class="wp-block-image size-large">
                        <img src="${post.finalDishImageUrl}" alt="Final dish: ${post.keyword}" />
                    </figure>
                `
            }

            fullHtml += `
                <div class="article-conclusion">${content.conclusion}</div>
            `

            const wpResult = await publishToWordPress({
                title: content.title,
                slug: content.slug,
                html: fullHtml,
                featured_media: content.featuredMediaId,
                rankMath: post.rankMathData ? JSON.parse(post.rankMathData) : null
            }, {
                wpUrl: site.wpUrl,
                wpUser: site.wpUser,
                wpAppPass: site.wpAppPass
            })

            content.wpId = wpResult.id
            content.wpLink = wpResult.link

            nextStep = 4 // DONE
            status = "DONE"
            await log(postId, `Published! ID: ${wpResult.id}`, "SUCCESS")
        }

        // Update DB
        await prisma.post.update({
            where: { id: postId },
            data: {
                content: JSON.stringify(content),
                step: nextStep,
                status: status,
            },
        })

        revalidatePath(`/projects/${post.batchId}`)
        return { done: status === "DONE", status, step: nextStep }

    } catch (error: any) {
        console.error("Processing Error", error)
        await log(postId, `Error: ${error.message}`, "ERROR")
        await prisma.post.update({
            where: { id: postId },
            data: { status: "ERROR" },
        })
        return { done: true, error: error.message }
    }
}

async function log(postId: string, message: string, level: string) {
    try {
        await prisma.log.create({
            data: {
                postId,
                message,
                level,
            },
        })
    } catch (e) {
        console.error("Log failed", e)
    }
}
