'use server'

import OpenAI from 'openai'
import { prisma } from '@/lib/prisma'
import { estimateCostUsd, extractUsage } from '@/lib/cost'

type PromptGroupsJSON = {
    groups: { id: string; name: string; articlePrompt: string }[]
    activeGroup: string
}

function cleanJson(content: string): string {
    let c = content.trim()
    if (c.startsWith('```json')) c = c.replace(/```json\n?/, '').replace(/```\n?$/, '')
    else if (c.startsWith('```')) c = c.replace(/```\n?/, '').replace(/```\n?$/, '')
    return c
}

function countWords(html: string): number {
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean).length
}

import { scrapeCompetitorUrl } from './scrape'

// ─── Create a new PillarArticle record (DRAFT) ───────────────────────────────
export async function createPillarArticle(formData: FormData): Promise<{ success: boolean; id?: string; error?: string }> {
    const keyword = formData.get('keyword') as string
    const titleInput = formData.get('title') as string
    const targetWords = parseInt(formData.get('targetWords') as string) || 4000
    const subtopicsRaw = formData.get('subtopics') as string
    const competitorUrl = formData.get('competitorUrl') as string

    if (!keyword?.trim()) return { success: false, error: 'Keyword is required' }

    const title = titleInput?.trim() || keyword.trim()
    const subtopics = subtopicsRaw ? JSON.parse(subtopicsRaw) : []
    
    // Default SEO Data
    const seoData: any = { focusKeyword: keyword.trim(), seoTitle: title }

    if (competitorUrl && competitorUrl.trim()) {
        try {
            const scrapeResult = await scrapeCompetitorUrl(competitorUrl.trim())
            if (scrapeResult.success && scrapeResult.data) {
                seoData.competitorData = scrapeResult.data
            }
        } catch (err: any) {
            console.error("Competitor scraping failed", err)
            // Continue creating article without competitor data
        }
    }

    const pillar = await prisma.pillarArticle.create({
        data: {
            title,
            keyword: keyword.trim(),
            targetWords,
            subtopics: JSON.stringify(subtopics),
            status: 'DRAFT',
            seoData: JSON.stringify(seoData)
        },
    })

    return { success: true, id: pillar.id }
}

// ─── Generate outline (TOC) ───────────────────────────────────────────────────
export async function generatePillarOutline(pillarId: string): Promise<{ success: boolean; error?: string }> {
    const pillar = await prisma.pillarArticle.findUnique({ where: { id: pillarId } })
    if (!pillar) return { success: false, error: 'Pillar article not found' }

    const settings = await prisma.settings.findFirst()
    if (!settings?.openRouterKey) return { success: false, error: 'OpenRouter API key not configured in Settings' }

    const subtopics: string[] = pillar.subtopics ? JSON.parse(pillar.subtopics) : []
    let subtopicList = subtopics.length > 0
        ? `Focus especially on these subtopics: ${subtopics.join(', ')}.`
        : ''

    let seoData: any = {}
    try {
        seoData = pillar.seoData ? JSON.parse(pillar.seoData) : {}
    } catch {}

    if (seoData.competitorData) {
        subtopicList += `\n\nCRITICAL CONTEXT: YOU MUST BEAT THIS COMPETITOR. This is the competitor's current content structure:
Competitor Headings:
${seoData.competitorData.headings.join('\n- ')}

Your task is to create an outline that covers these topics BUT ALSO adds substantial new, unique, and related semantic value that they missed. Your outline must be drastically better and more thorough than theirs.`
    }

    const client = new OpenAI({ apiKey: settings.openRouterKey, baseURL: 'https://openrouter.ai/api/v1' })

    // Log start
    await prisma.pillarLog.create({ data: { pillarId, message: 'Generating outline...', level: 'INFO' } })
    await prisma.pillarArticle.update({ where: { id: pillarId }, data: { status: 'GENERATING' } })

    try {
        const prompt = `You are an elite SEO strategist and expert content structurer.
Your task is to generate a comprehensive, highly-structured outline for a ${pillar.targetWords.toLocaleString()}-word Pillar Article about: "${pillar.keyword}".

${subtopicList}

Rules:
1. Break it down into logical, chronological, or thematic sections (H2s).
2. Each section must have 2-4 subheadings (H3s).
3. The outline should be robust enough to support ${pillar.targetWords.toLocaleString()} words (expect ~400-600 words per section).
4. Do NOT output any introductory text.
5. Provide the output in strictly valid JSON format like this:
{
  "articleTitle": "SEO-optimized H1 title (55-65 chars)",
  "metaDescription": "compelling meta description (145-160 chars)",
  "sections": [
    {
      "heading": "H2 section title",
      "subheadings": ["H3 subsection 1", "H3 subsection 2"]
    }
  ]
}`

        const res = await client.chat.completions.create({
            model: settings.aiModel || 'openai/gpt-4o',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.4,
        })

        const raw = res.choices[0]?.message?.content || '{}'
        const parsed = JSON.parse(cleanJson(raw))

        // Track usage
        const usage = extractUsage(res)
        const model = settings.aiModel || 'openai/gpt-4o'
        const costUsd = estimateCostUsd(model, usage.promptTokens, usage.completionTokens)

        await prisma.pillarArticle.update({
            where: { id: pillarId },
            data: {
                title: parsed.articleTitle || pillar.title,
                outline: JSON.stringify(parsed.sections || []),
                seoData: JSON.stringify({
                    focusKeyword: pillar.keyword,
                    seoTitle: parsed.articleTitle,
                    metaDesc: parsed.metaDescription,
                }),
                promptTokens: { increment: usage.promptTokens },
                completionTokens: { increment: usage.completionTokens },
                costUsd: { increment: costUsd },
            },
        })

        // Log to global usage table
        await prisma.usageLog.create({
            data: {
                source: 'pillar',
                sourceId: pillarId,
                model,
                operation: 'outline',
                ...usage,
                costUsd,
            }
        })

        await prisma.pillarLog.create({ data: { pillarId, message: `Outline ready: ${parsed.sections?.length || 0} sections`, level: 'SUCCESS' } })
        return { success: true }
    } catch (err: any) {
        await prisma.pillarLog.create({ data: { pillarId, message: `Outline error: ${err.message}`, level: 'ERROR' } })
        await prisma.pillarArticle.update({ where: { id: pillarId }, data: { status: 'ERROR' } })
        return { success: false, error: err.message }
    }
}

// ─── Update existing outline manually ───────────────────────────────────────────
export async function updatePillarOutline(pillarId: string, newOutline: any[]): Promise<{ success: boolean; error?: string }> {
    try {
        await prisma.pillarArticle.update({
            where: { id: pillarId },
            data: { outline: JSON.stringify(newOutline) }
        })
        await prisma.pillarLog.create({ data: { pillarId, message: 'Outline updated manually', level: 'INFO' } })
        return { success: true }
    } catch (err: any) {
        return { success: false, error: err.message || 'Failed to update outline' }
    }
}

// ─── Generate a single section ────────────────────────────────────────────────
export async function generatePillarSection(
    pillarId: string,
    sectionIndex: number
): Promise<{ success: boolean; error?: string }> {
    const pillar = await prisma.pillarArticle.findUnique({ where: { id: pillarId } })
    if (!pillar || !pillar.outline) return { success: false, error: 'Outline not generated yet' }

    const settings = await prisma.settings.findFirst()
    if (!settings?.openRouterKey) return { success: false, error: 'OpenRouter API key not configured' }

    const outline: { heading: string; subheadings: string[] }[] = JSON.parse(pillar.outline)
    const section = outline[sectionIndex]
    if (!section) return { success: false, error: `Section ${sectionIndex} not found` }

    const existingSections: { index: number; title: string; html: string; wordCount: number }[] =
        pillar.sections ? JSON.parse(pillar.sections) : []

    const client = new OpenAI({ apiKey: settings.openRouterKey, baseURL: 'https://openrouter.ai/api/v1' })

    await prisma.pillarLog.create({
        data: { pillarId, message: `Generating section ${sectionIndex + 1}: "${section.heading}"`, level: 'INFO' },
    })

    // Get custom article prompt if any
    let basePromptInstruction = 'You are an expert SEO content writer.'
    if (settings.promptGroups) {
        try {
            const pg: PromptGroupsJSON = JSON.parse(settings.promptGroups)
            const activeGroup = pg.groups.find((g) => g.id === pg.activeGroup) || pg.groups[0]
            if (activeGroup?.articlePrompt) basePromptInstruction = activeGroup.articlePrompt
        } catch { /* use default */ }
    }

    try {
        const prompt = `${basePromptInstruction}

You are writing section ${sectionIndex + 1} of a comprehensive pillar article.

Article Topic: "${pillar.keyword}"
Article Title: "${pillar.title}"

Write the following section IN FULL:
Section Heading (H2): ${section.heading}
Subsections to cover (H3s): ${section.subheadings.join(', ')}

Guidelines:
- Write 400–600 words for this section
- Use proper HTML: <h2> for main heading, <h3> for subsections, <p> for paragraphs
- Be comprehensive, practical, and helpful
- Include specific tips, examples, or data where relevant
- Naturally use the keyword "${pillar.keyword}" 1–2 times
- Do NOT include introduction or conclusion (those are other sections)
- Return ONLY the HTML for this section, no other text`

        const res = await client.chat.completions.create({
            model: settings.aiModel || 'openai/gpt-4o',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.6,
        })

        const html = res.choices[0]?.message?.content || ''
        const words = countWords(html)

        // Track usage per section
        const usage = extractUsage(res)
        const modelUsed = settings.aiModel || 'openai/gpt-4o'
        const costUsd = estimateCostUsd(modelUsed, usage.promptTokens, usage.completionTokens)

        // Upsert section
        const filtered = existingSections.filter((s) => s.index !== sectionIndex)
        const updated = [...filtered, { index: sectionIndex, title: section.heading, html, wordCount: words }]
            .sort((a, b) => a.index - b.index)

        const totalWords = updated.reduce((sum, s) => sum + s.wordCount, 0)
        const allDone = updated.length >= outline.length

        await prisma.pillarArticle.update({
            where: { id: pillarId },
            data: {
                sections: JSON.stringify(updated),
                wordCount: totalWords,
                status: allDone ? 'DONE' : 'GENERATING',
                content: allDone ? updated.map((s) => s.html).join('\n\n') : pillar.content,
                promptTokens: { increment: usage.promptTokens },
                completionTokens: { increment: usage.completionTokens },
                costUsd: { increment: costUsd },
                updatedAt: new Date(),
            },
        })

        // Log to global usage table
        await prisma.usageLog.create({
            data: {
                source: 'pillar',
                sourceId: pillarId,
                model: modelUsed,
                operation: `section_${sectionIndex + 1}`,
                ...usage,
                costUsd,
            }
        })

        await prisma.pillarLog.create({
            data: {
                pillarId,
                message: `Section ${sectionIndex + 1} done: ~${words} words`,
                level: 'SUCCESS',
            },
        })

        return { success: true }
    } catch (err: any) {
        await prisma.pillarLog.create({ data: { pillarId, message: `Section ${sectionIndex + 1} error: ${err.message}`, level: 'ERROR' } })
        return { success: false, error: err.message }
    }
}

// ─── Get current pillar data (for polling) ───────────────────────────────────
export async function getPillarData(pillarId: string) {
    return prisma.pillarArticle.findUnique({
        where: { id: pillarId },
        include: { logs: { orderBy: { createdAt: 'desc' }, take: 20 } },
    })
}

// ─── Publish Pillar to WordPress ─────────────────────────────────────────────
import { publishToWordPress } from '@/lib/wordpress'
import { generateImages } from '@/app/actions/generate-images'

export async function publishPillarArticleToWP(pillarId: string, siteId: string): Promise<{ success: boolean; wpLink?: string; error?: string }> {
    const pillar = await prisma.pillarArticle.findUnique({ where: { id: pillarId } })
    if (!pillar) return { success: false, error: 'Pillar article not found' }
    if (!pillar.content) return { success: false, error: 'Article has no content generated yet' }

    const site = await prisma.site.findUnique({ where: { id: siteId } })
    if (!site) return { success: false, error: 'WordPress site not found' }

    const settings = await prisma.settings.findFirst()
    if (!settings) return { success: false, error: 'Settings not configured' }

    await prisma.pillarLog.create({ data: { pillarId, message: 'Starting publish process to WordPress...', level: 'INFO' } })

    let imageUrl: string | undefined = undefined

    // Determine Image Generation API Key based on Provider
    let imageApiKey = settings.imageProvider === 'linkrapi' ? settings.linkrApiKey :
                      settings.imageProvider === 'ttapi' ? settings.ttapiKey : settings.goapiKey

    if (settings.imageProvider && imageApiKey) {
        await prisma.pillarLog.create({ data: { pillarId, message: `Generating Featured Image via ${settings.imageProvider}...`, level: 'INFO' } })
        
        let featureImagePrompt = "Professional photography of {keyword}, natural lighting, 8k, highly detailed."
        if (settings.promptGroups) {
            try {
                const pg = JSON.parse(settings.promptGroups)
                const active = pg.groups.find((g: any) => g.id === pg.activeGroup) || pg.groups[0]
                if (active?.featureImagePrompt) featureImagePrompt = active.featureImagePrompt
            } catch { }
        }

        const prompt = featureImagePrompt.replace(/{keyword}/gi, pillar.keyword).replace(/{title}/gi, pillar.title)
        
        const imageRes = await generateImages([
            { type: 'featured', prompt, alt_text: pillar.keyword }
        ], imageApiKey, settings.imageProvider)

        if (imageRes && imageRes.success && imageRes.images && imageRes.images.length > 0 && imageRes.images[0].url) {
            imageUrl = imageRes.images[0].url
            await prisma.pillarLog.create({ data: { pillarId, message: 'Featured Image generated successfully', level: 'SUCCESS' } })
        } else {
            await prisma.pillarLog.create({ data: { pillarId, message: 'Featured Image generation failed or returned empty', level: 'WARN' } })
        }
    } else {
        await prisma.pillarLog.create({ data: { pillarId, message: 'Skipping image generation (provider or key missing)', level: 'WARN' } })
    }

    // Assemble HTML
    let fullHtml = ''
    if (imageUrl) {
        fullHtml += `<figure class="wp-block-image size-large"><img src="${imageUrl}" alt="${pillar.keyword}" /></figure>\n\n`
    }
    fullHtml += pillar.content

    let seoData = pillar.seoData ? JSON.parse(pillar.seoData) : {}

    await prisma.pillarLog.create({ data: { pillarId, message: `Publishing to ${site.wpUrl}...`, level: 'INFO' } })

    try {
        const wpResult = await publishToWordPress({
            title: pillar.title,
            slug: pillar.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
            html: fullHtml,
            rankMath: {
                seo_title: seoData.seoTitle || pillar.title,
                seo_description: seoData.metaDesc || '',
                focus_keyword: pillar.keyword
            }
        }, {
            wpUrl: site.wpUrl,
            wpUser: site.wpUser,
            wpAppPass: site.wpAppPass
        })

        seoData.wpId = wpResult.id
        seoData.wpLink = wpResult.link
        seoData.imageUrl = imageUrl

        await prisma.pillarArticle.update({
            where: { id: pillarId },
            data: {
                seoData: JSON.stringify(seoData),
                status: 'PUBLISHED',
                siteId: site.id
            }
        })

        await prisma.pillarLog.create({ data: { pillarId, message: `Successfully published: ${wpResult.link}`, level: 'SUCCESS' } })

        return { success: true, wpLink: wpResult.link }
    } catch (e: any) {
        await prisma.pillarLog.create({ data: { pillarId, message: `WP Publish Error: ${e.message}`, level: 'ERROR' } })
        return { success: false, error: e.message }
    }
}
