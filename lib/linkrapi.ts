'use server'

const LINKRAPI_BASE_URL = 'https://linkrapi.com/api/v1'

/**
 * Submit an image generation task to LinkrAPI (Midjourney proxy)
 * POST /v1/imagine
 * @returns task_id to poll with linkrFetch
 */
export async function linkrImagine(prompt: string, apiKey: string): Promise<string> {
    const response = await fetch(`${LINKRAPI_BASE_URL}/imagine`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
        cache: 'no-store',
    })

    if (!response.ok) {
        const error = await response.text()
        throw new Error(`LinkrAPI Imagine Error ${response.status}: ${error}`)
    }

    const data = await response.json()
    if (!data.task_id) {
        throw new Error(`LinkrAPI: No task_id returned. Response: ${JSON.stringify(data)}`)
    }

    return data.task_id
}

/**
 * Poll the task status endpoint
 * GET /v1/fetch/{task_id}
 */
export async function linkrFetchTask(taskId: string, apiKey: string): Promise<{
    task_id: string
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'timeout'
    progress: number
    image_url: string | null
    error: string | null
}> {
    const response = await fetch(`${LINKRAPI_BASE_URL}/fetch/${taskId}`, {
        headers: {
            Authorization: `Bearer ${apiKey}`,
        },
        cache: 'no-store',
    })

    if (!response.ok) {
        const error = await response.text()
        throw new Error(`LinkrAPI Fetch Error ${response.status}: ${error}`)
    }

    return response.json()
}

/**
 * Submit prompt and poll until completed — returns the final image URL
 * @param maxWaitSeconds max time to wait (default 5 minutes)
 * @param pollIntervalMs how often to poll (default 8 seconds)
 */
export async function linkrWaitForResult(
    prompt: string,
    apiKey: string,
    maxWaitSeconds = 300,
    pollIntervalMs = 8000
): Promise<string> {
    // 1. Submit the task
    const taskId = await linkrImagine(prompt, apiKey)
    console.log(`[LinkrAPI] Task submitted: ${taskId}`)

    // 2. Poll until complete
    const start = Date.now()
    while ((Date.now() - start) / 1000 < maxWaitSeconds) {
        const result = await linkrFetchTask(taskId, apiKey)
        console.log(`[LinkrAPI] Progress: ${result.progress}% | Status: ${result.status}`)

        if (result.status === 'completed' && result.image_url) {
            return result.image_url
        }

        if (result.status === 'failed' || result.status === 'timeout') {
            throw new Error(`LinkrAPI generation ${result.status}: ${result.error || 'Unknown error'}`)
        }

        await new Promise((resolve) => setTimeout(resolve, pollIntervalMs))
    }

    throw new Error(`LinkrAPI: Timed out after ${maxWaitSeconds}s waiting for task ${taskId}`)
}

/**
 * Validate a LinkrAPI key by fetching account info
 * GET /v1/info
 */
export async function validateLinkrApiKey(apiKey: string): Promise<{
    valid: boolean
    message?: string
    error?: string
}> {
    if (!apiKey || apiKey.trim() === '') {
        return { valid: false, error: 'API key is required' }
    }

    try {
        // Since /v1/info is currently timing out / 502, we can validate the API key securely 
        // by making a test request to fetch a fake task.
        // If it returns 401 Unauthorized, the key is bad.
        // If it returns 404 Not Found, the key is valid (the task just doesn't exist).
        const response = await fetch(`${LINKRAPI_BASE_URL}/fetch/validation-ping`, {
            headers: {
                Authorization: `Bearer ${apiKey}`,
            },
            cache: 'no-store',
        })

        if (response.status === 401 || response.status === 403) {
            return { valid: false, error: 'Invalid API key' }
        }

        if (response.status === 404 || response.ok) {
            return {
                valid: true,
                message: `✅ Connected! LinkrAPI access granted.`,
            }
        }
        
        return { valid: false, error: `Invalid response (HTTP ${response.status})` }
    } catch (error: any) {
        return { valid: false, error: error.message || 'Connection failed' }
    }
}
