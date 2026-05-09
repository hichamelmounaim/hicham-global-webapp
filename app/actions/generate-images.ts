'use server'

import OpenAI from 'openai'
import { ttapiImagine, ttapiWaitForResult } from "@/lib/ttapi"
import { linkrWaitForResult } from "@/lib/linkrapi"

export async function generateImages(imagePrompts: any[], apiKey: string, provider: string = 'goapi') {
    const results = []

    for (const promptData of imagePrompts) {
        try {
            let imageUrl: string | null = null

            if (provider === 'goapi' || provider === 'openrouter') {
                // Use DALL-E 3 via OpenRouter
                const client = new OpenAI({
                    apiKey: apiKey,
                    baseURL: "https://openrouter.ai/api/v1",
                })

                const response = await client.images.generate({
                    model: "openai/dall-e-3",
                    prompt: promptData.prompt,
                    n: 1,
                    size: "1024x1024",
                    quality: "standard",
                })
                imageUrl = response.data?.[0]?.url || null
            } else if (provider === 'ttapi') {
                // Use Midjourney via TTAPI
                const imagineResponse = await ttapiImagine(promptData.prompt, apiKey)
                const jobId = imagineResponse.data.jobId
                imageUrl = await ttapiWaitForResult(jobId, apiKey)
            } else if (provider === 'linkrapi') {
                // Use Midjourney via LinkrAPI
                imageUrl = await linkrWaitForResult(promptData.prompt, apiKey)
            }

            if (imageUrl) {
                results.push({
                    type: promptData.type,
                    url: imageUrl,
                    alt_text: promptData.alt_text,
                    caption: promptData.caption,
                    prompt: promptData.prompt
                })
            }

            // Delay to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 2000))

        } catch (error: any) {
            console.error(`Image generation error for ${promptData.type}:`, error)
            results.push({
                type: promptData.type,
                error: error.message
            })
        }
    }

    return { success: true, images: results }
}

export async function uploadToWordPress(imageUrl: string, filename: string, wpUrl: string, wpUser: string, wpAppPass: string) {
    try {
        // Download image from URL
        const imageResponse = await fetch(imageUrl)
        const imageBlob = await imageResponse.blob()

        // Upload to WordPress
        const formData = new FormData()
        formData.append('file', imageBlob, filename)

        const uploadResponse = await fetch(`${wpUrl}/wp-json/wp/v2/media`, {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + Buffer.from(`${wpUser}:${wpAppPass}`).toString('base64')
            },
            body: formData
        })

        if (!uploadResponse.ok) {
            throw new Error(`WordPress upload failed: ${uploadResponse.statusText}`)
        }

        const media = await uploadResponse.json()

        return {
            success: true,
            media_id: media.id,
            url: media.source_url,
            alt_text: media.alt_text
        }
    } catch (error: any) {
        console.error('WordPress upload error:', error)
        return {
            success: false,
            error: error.message
        }
    }
}
