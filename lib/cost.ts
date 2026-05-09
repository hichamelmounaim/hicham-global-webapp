/**
 * Utility to estimate USD cost from token usage.
 * Prices are approximate per-million-token rates for common OpenRouter models.
 * Falls back to a generic estimate if the model is unknown.
 */

const MODEL_COST_PER_1M: Record<string, { input: number; output: number }> = {
    // OpenAI
    'openai/gpt-4o': { input: 5.0, output: 15.0 },
    'openai/gpt-4o-mini': { input: 0.15, output: 0.6 },
    'openai/gpt-4-turbo': { input: 10.0, output: 30.0 },
    'openai/o3': { input: 2.0, output: 8.0 },
    // Anthropic
    'anthropic/claude-3.5-sonnet': { input: 3.0, output: 15.0 },
    'anthropic/claude-3.7-sonnet': { input: 3.0, output: 15.0 },
    'anthropic/claude-3-haiku': { input: 0.25, output: 1.25 },
    // Google
    'google/gemini-2.0-flash': { input: 0.1, output: 0.4 },
    'google/gemini-1.5-pro': { input: 3.5, output: 10.5 },
    // Meta / Llama
    'meta-llama/llama-3-70b-instruct': { input: 0.6, output: 0.8 },
    'meta-llama/llama-3.1-405b-instruct': { input: 2.7, output: 2.7 },
    // Mistral
    'mistralai/mistral-7b-instruct': { input: 0.07, output: 0.07 },
    'mistralai/mixtral-8x7b-instruct': { input: 0.24, output: 0.24 },
    // DeepSeek
    'deepseek/deepseek-r1': { input: 0.55, output: 2.19 },
    'deepseek/deepseek-chat': { input: 0.14, output: 0.28 },
}

const GENERIC_FALLBACK = { input: 1.0, output: 3.0 } // per 1M tokens

export function estimateCostUsd(model: string, promptTokens: number, completionTokens: number): number {
    const rates = MODEL_COST_PER_1M[model] || GENERIC_FALLBACK
    const inputCost = (promptTokens / 1_000_000) * rates.input
    const outputCost = (completionTokens / 1_000_000) * rates.output
    return parseFloat((inputCost + outputCost).toFixed(6))
}

export function extractUsage(res: { usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | null }) {
    return {
        promptTokens: res.usage?.prompt_tokens ?? 0,
        completionTokens: res.usage?.completion_tokens ?? 0,
        totalTokens: res.usage?.total_tokens ?? 0,
    }
}
