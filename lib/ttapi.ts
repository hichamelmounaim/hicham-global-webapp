'use server'

import { prisma } from "@/lib/prisma"

const TTAPI_BASE_URL = "https://hold.ttapi.io/midjourney/v1"

export async function ttapiImagine(prompt: string, apiKey: string) {
    const response = await fetch(`${TTAPI_BASE_URL}/imagine`, {
        method: 'POST',
        headers: {
            'TT-API-KEY': apiKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            prompt,
            mode: "fast"
        })
    })

    if (!response.ok) {
        const error = await response.text()
        throw new Error(`TTAPI Imagine Error: ${error}`)
    }

    return response.json()
}

export async function ttapiFetch(jobId: string, apiKey: string) {
    const response = await fetch(`${TTAPI_BASE_URL}/fetch`, {
        method: 'POST',
        headers: {
            'TT-API-KEY': apiKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ jobId })
    })

    if (!response.ok) {
        const error = await response.text()
        throw new Error(`TTAPI Fetch Error: ${error}`)
    }

    return response.json()
}

export async function ttapiWaitForResult(jobId: string, apiKey: string, maxAttempts = 30) {
    let attempts = 0
    while (attempts < maxAttempts) {
        const result = await ttapiFetch(jobId, apiKey)

        if (result.status === "SUCCESS") {
            return result.data.images[0] // Return the first image link
        } else if (result.status === "FAILED") {
            throw new Error(`TTAPI Generation Failed: ${result.message || 'Unknown error'}`)
        }

        // Wait 10 seconds before polling again
        await new Promise(resolve => setTimeout(resolve, 10000))
        attempts++
    }

    throw new Error("TTAPI Generation Timeout")
}
