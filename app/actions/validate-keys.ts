'use server'

import OpenAI from "openai"

export async function validateOpenRouterKey(apiKey: string) {
    if (!apiKey || apiKey.trim() === '') {
        return {
            valid: false,
            error: 'API key is required'
        }
    }

    try {
        const client = new OpenAI({
            apiKey: apiKey,
            baseURL: "https://openrouter.ai/api/v1",
        })

        // Make a simple request to validate the key
        const response = await client.models.list()

        return {
            valid: true,
            message: 'API key is valid!',
            modelCount: response.data?.length || 0
        }
    } catch (error: any) {
        return {
            valid: false,
            error: error?.message || 'Invalid API key or connection failed'
        }
    }
}
