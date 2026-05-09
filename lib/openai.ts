import OpenAI from "openai"
import { prisma } from "@/lib/prisma"

export async function getOpenAIClient() {
    const settings = await prisma.settings.findFirst()

    // Prioritize OpenRouter if key exists
    if (settings?.openRouterKey) {
        return {
            client: new OpenAI({
                apiKey: settings.openRouterKey,
                baseURL: "https://openrouter.ai/api/v1",
                defaultHeaders: {
                    "HTTP-Referer": "https://hicham-global.com", // Optional, for OpenRouter rankings
                    "X-Title": "Hicham Global App",
                },
            }),
            model: settings.aiModel || "openai/gpt-4o",
        }
    }

    // Fallback to OpenAI Direct
    if (settings?.openaiKey) {
        return {
            client: new OpenAI({
                apiKey: settings.openaiKey,
            }),
            model: "gpt-4o",
        }
    }

    throw new Error("No API Key configured. Please set OpenRouter or OpenAI Key in Settings.")
}
