'use server'

export interface OpenRouterModel {
    id: string
    name: string
    context_length: number
    architecture?: {
        modality?: string
    }
    pricing?: {
        prompt?: string
        completion?: string
    }
}

export async function fetchOpenRouterModels(apiKey: string): Promise<{
    success: boolean
    models?: OpenRouterModel[]
    error?: string
}> {
    if (!apiKey || apiKey.trim() === '') {
        return { success: false, error: 'API key is required' }
    }

    try {
        const response = await fetch('https://openrouter.ai/api/v1/models', {
            headers: {
                Authorization: `Bearer ${apiKey}`,
            },
            cache: 'no-store',
        })

        if (!response.ok) {
            return { success: false, error: `API error: ${response.status} ${response.statusText}` }
        }

        const data = await response.json()
        const allModels: OpenRouterModel[] = data.data || []

        // Filter to text-to-text models only (exclude image generation, audio, etc.)
        const textModels = allModels.filter((m) => {
            const modality = m.architecture?.modality || ''
            // Include models where modality contains 'text->text' or is text-based
            // Exclude pure image/audio generation models
            const isImageOnly =
                m.id.includes('dall-e') ||
                m.id.includes('stable-diffusion') ||
                m.id.includes('midjourney') ||
                m.id.includes('flux') ||
                m.id.includes('imagen') ||
                modality === 'image->image' ||
                modality === 'text->image'
            return !isImageOnly
        })

        // Sort by provider then name
        textModels.sort((a, b) => a.id.localeCompare(b.id))

        return { success: true, models: textModels }
    } catch (error: any) {
        return { success: false, error: error.message || 'Failed to fetch models' }
    }
}
