'use server'

import { prisma } from '@/lib/prisma'
import { generateRecipeData, generateImagePrompts, generateRankMathData } from './generate-recipe-data'
import { generateImages, uploadToWordPress } from './generate-images'
import { revalidatePath } from 'next/cache'
import { ImagePrompt } from '@/lib/types'

export async function testGenerateRecipe(postId: string) {
    try {
        // Get the post
        const post = await prisma.post.findUnique({
            where: { id: postId }
        })

        if (!post) {
            return { success: false, error: 'Post not found' }
        }

        // Get settings
        const settings = await prisma.settings.findFirst()
        if (!settings?.openRouterKey) {
            return { success: false, error: 'OpenRouter API key not configured' }
        }

        const keyword = post.keyword
        const aiModel = settings.aiModel || 'openai/gpt-4o-mini'
        const apiKey = settings.openRouterKey

        // Step 1: Generate recipe data
        console.log('Generating recipe data...')
        const recipeResult = await generateRecipeData(keyword, aiModel, apiKey)

        if (!recipeResult.success) {
            return { success: false, error: `Recipe generation failed: ${recipeResult.error}` }
        }

        const recipeData = recipeResult.data
        console.log('Recipe data generated:', recipeData.title)

        // Save recipe data
        await prisma.post.update({
            where: { id: postId },
            data: {
                recipeData: JSON.stringify(recipeData)
            }
        })

        // Step 2: Generate image prompts
        console.log('Generating image prompts...')
        const imagePromptsResult = await generateImagePrompts(
            keyword,
            recipeData.title,
            recipeData.ingredients || [],
            aiModel,
            apiKey
        )

        if (!imagePromptsResult.success) {
            return { success: false, error: `Image prompts failed: ${imagePromptsResult.error}` }
        }

        const imagePrompts = imagePromptsResult.data
        console.log(`Generated ${imagePrompts.length} image prompts`)

        // Step 3: Generate images
        const provider = settings.imageProvider || 'goapi'
        const imageApiKey = provider === 'ttapi' ? settings.ttapiKey : settings.openRouterKey

        console.log(`Generating images with ${provider}...`)
        const imagesResult = await generateImages(imagePrompts, imageApiKey || "", provider)

        if (!imagesResult.success) {
            return { success: false, error: 'Image generation failed' }
        }

        const images = imagesResult.images

        // Find site for WP upload
        const site = await prisma.site.findFirst({
            where: { batches: { some: { id: post.batchId } } }
        }) || await prisma.site.findFirst({ where: { isDefault: true } }) || await prisma.site.findFirst()

        let featuredImageUrl = ""
        let ingredientsImageUrl = ""
        let finalImageUrl = ""
        let featuredMediaId = undefined

        if (site) {
            console.log(`Uploading images to WordPress site: ${site.name}`)
            // Sequential upload to avoid overwhelming WP or network
            for (const img of images) {
                if (img.error) continue

                // Check for valid URL before upload attempts
                if (!img.url) {
                    console.warn(`Skipping upload for ${img.type}: No URL present`)
                    continue;
                }

                const filename = `${keyword.toLowerCase().replace(/\s+/g, '-')}-${img.type}.jpg`
                const uploadResult = await uploadToWordPress(img.url, filename, site.wpUrl, site.wpUser, site.wpAppPass)

                if (uploadResult.success) {
                    if (img.type === 'featured') {
                        featuredImageUrl = uploadResult.url || ""
                        featuredMediaId = uploadResult.media_id
                    }
                    if (img.type === 'ingredients') ingredientsImageUrl = uploadResult.url || ""
                    if (img.type === 'final' || img.type === 'final_dish') finalImageUrl = uploadResult.url || ""
                } else {
                    // Fallback to direct URL if upload fails
                    console.warn(`Upload failed for ${img.type}, using direct URL`)
                    if (img.type === 'featured') featuredImageUrl = img.url || ""
                    if (img.type === 'ingredients') ingredientsImageUrl = img.url || ""
                    if (img.type === 'final' || img.type === 'final_dish') finalImageUrl = img.url || ""
                }
            }
        } else {
            console.log('No specific site found, using direct URLs')
            const featuredImage = images.find((img: any) => img.type === 'featured')
            const ingredientsImage = images.find((img: any) => img.type === 'ingredients')
            const finalImage = images.find((img: any) => img.type === 'final' || img.type === 'final_dish')

            featuredImageUrl = featuredImage?.url || ""
            ingredientsImageUrl = ingredientsImage?.url || ""
            finalImageUrl = finalImage?.url || ""
        }

        // Save image URLs
        await prisma.post.update({
            where: { id: postId },
            data: {
                featuredImageUrl,
                ingredientsImageUrl,
                finalDishImageUrl: finalImageUrl
            }
        })

        // Step 4: Generate Rank Math SEO data
        console.log('Generating Rank Math data...')
        const rankMathResult = await generateRankMathData(
            keyword,
            recipeData.title,
            aiModel,
            apiKey
        )

        if (rankMathResult.success) {
            await prisma.post.update({
                where: { id: postId },
                data: {
                    rankMathData: JSON.stringify(rankMathResult.data)
                }
            })
            console.log('Rank Math data saved')
        } else {
            console.error('Rank Math generation failed:', rankMathResult.error)
        }

        revalidatePath(`/posts/${postId}`)

        return {
            success: true,
            message: 'Recipe, images, and SEO data generated successfully',
            data: {
                recipe: recipeData.title,
                images: images.length,
                seo: rankMathResult.success
            }
        }

    } catch (error: any) {
        console.error('Test generation error:', error)
        return { success: false, error: error.message }
    }
}
