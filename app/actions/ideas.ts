"use server"

import { auth } from "@/lib/auth"

export async function generateKeywordIdeas(query: string) {
    const session = await auth()
    if (!session?.user) {
        return { success: false, error: "Unauthorized" }
    }

    if (!query || query.trim() === '') {
        return { success: false, error: "Query is required" }
    }

    try {
        // We use Google's open suggest API as a proxy for fast idea generation
        // It provides highly relevant autocomplete suggestions similar to Pinterest search
        const response = await fetch(`http://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(query.trim())}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        })

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`)
        }

        const data = await response.json()
        const suggestions: string[] = data[1] || []
        
        // Format the results
        const results = suggestions.map((suggestion, index) => ({
            keyword: suggestion,
            rank: index + 1,
            source: "google_suggest"
        }))

        return { success: true, ideas: results }
    } catch (error) {
        console.error("Failed to fetch keyword ideas:", error)
        return { success: false, error: "Failed to generate ideas" }
    }
}
