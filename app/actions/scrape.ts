'use server'

import * as cheerio from 'cheerio'

export interface ScrapedCompetitorData {
    title: string
    headings: string[]
    paragraphs: string[]
    wordCount: number
    url: string
}

export async function scrapeCompetitorUrl(url: string): Promise<{ success: boolean; data?: ScrapedCompetitorData; error?: string }> {
    try {
        if (!url.startsWith('http')) {
            url = 'https://' + url
        }

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9'
            }
        })
        clearTimeout(timeoutId)

        if (!response.ok) {
            return { success: false, error: `Failed to fetch URL: ${response.status} ${response.statusText}` }
        }

        const html = await response.text()
        const $ = cheerio.load(html)
        
        // Remove noise
        $('script, style, nav, footer, header, aside, .sidebar, .nav, .menu, .ads, iframe, svg').remove()

        const title = $('title').text() || $('h1').first().text()
        
        const headings: string[] = []
        $('h1, h2, h3').each((_, el) => {
            const text = $(el).text().trim()
            if (text && text.length > 3) {
                headings.push(text)
            }
        })

        const paragraphs: string[] = []
        let wordCount = 0
        $('p, li').each((_, el) => {
            const text = $(el).text().trim()
            if (text && text.length > 20) {
                paragraphs.push(text)
                wordCount += text.split(/\s+/).length
            }
        })

        // Limit the amount of data we send to the AI (context window protection)
        // We really just want the structural intent and main points.
        const limitedParagraphs = paragraphs.slice(0, 30) // ~1500 words max usually

        return {
            success: true,
            data: {
                title: title.trim(),
                headings,
                paragraphs: limitedParagraphs,
                wordCount,
                url
            }
        }

    } catch (e: any) {
        if (e.name === 'AbortError') {
            return { success: false, error: 'Request timeout: The competitor site took too long to respond.' }
        }
        return { success: false, error: e.message || 'Error parsing competitor URL' }
    }
}
