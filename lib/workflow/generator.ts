import { getOpenAIClient } from "@/lib/openai"
import { prisma } from "@/lib/prisma"

export interface GeneratedTitleAndMeta {
    title: string
    short_title: string
    slug: string
    tags: string
    meta_description: string
    key_words: string
}

async function getCustomPrompts() {
    const settings = await prisma.settings.findFirst()
    let prompts = {
        article: "You're a professional SEO blogger.",
        pinterest: "You are a social media manager."
    }
    if (settings?.promptGroups) {
        try {
            const pg = JSON.parse(settings.promptGroups)
            const active = pg.groups.find((g: any) => g.id === pg.activeGroup) || pg.groups[0]
            if (active) {
                if (active.articlePrompt) prompts.article = active.articlePrompt
                if (active.pinterestPrompt) prompts.pinterest = active.pinterestPrompt
            }
        } catch { }
    }
    return prompts
}

export async function generateTitleAndMeta(keyword: string): Promise<GeneratedTitleAndMeta> {
    const { client, model } = await getOpenAIClient()

    const systemPrompt = `Act like an expert food-blog SEO strategist. The focus keyword is "${keyword}", generate an array with one object containing:

  • title: An SEO Title (50–60 characters) that starts with the keyword and includes a benefit or hook.
  • Short title: An SEO Short Title (10–30 characters) that starts with the keyword.
  • slug: A URL-friendly slug for the blog post, based on ${keyword} (use lowercase, hyphens, 3–6 words, <= 72 chars, no special characters or numbers).
  • tags: A list of 5 SEO Tags relevant to the recipe niche, separated by commas.
  • meta_description: A Meta Description (under 145 characters) that starts with the keyword and is engaging, helpful, and SEO-optimized.
  • key_words: List of keywords most popular in USA and related to "${keyword}", separated by commas.

  Return only the following JSON array (no text before or after):
  [
    {
      "title": "...",
      "short_title": "...",
      "slug": "...",
      "tags": "...",
      "meta_description": "...",
      "key_words": "..."
    }
  ]
  `

    const completion = await client.chat.completions.create({
        messages: [{ role: "system", content: systemPrompt }],
        model: model,
    })

    try {
        const content = completion.choices[0].message.content || "[]"
        const cleanContent = content.replace(/```json/g, "").replace(/```/g, "").trim()
        const parsed = JSON.parse(cleanContent)
        return parsed[0]
    } catch (error) {
        console.error("Failed to parse OpenAI response for Title/Meta", error)
        throw new Error("Failed to generate Title and Meta")
    }
}

export async function generateIntro(keyword: string, titleMeta: GeneratedTitleAndMeta, bio: string): Promise<string> {
    const { client, model } = await getOpenAIClient()
    const customPrompts = await getCustomPrompts()

    const systemPrompt = `${customPrompts.article}
  Context:
  - Keyword: ${keyword}
  - Recipe Title: ${titleMeta.title}
  - Author Bio: ${bio}

  Task: Write 3 short paragraphs for the introduction.
  - Para 1: Hook + Trend Context (Mention keyword early).
  - Para 2: What the Recipe Is (Ingredients, pantry-friendly).
  - Para 3: Personal Connection (Based on bio).

  Output: Return exactly 3 paragraphs wrapped in <p> tags. No other text.
  `

    const completion = await client.chat.completions.create({
        messages: [{ role: "system", content: systemPrompt }],
        model: model,
    })

    return completion.choices[0].message.content || ""
}

export async function generateBodyOutline(keyword: string, titleMeta: GeneratedTitleAndMeta): Promise<{ outline: string[], table_suggestions: string[] }> {
    const { client, model } = await getOpenAIClient()

    const systemPrompt = `You're a professional SEO food blogger. Create a flexible outline for the body of a recipe blog post.
    Context:
    - Keyword: ${keyword}
    - Title: ${titleMeta.title}
    
    Output JSON object with keys (and nothing else):
    {
      "outline": ["topic 1", "topic 2", "topic 3"],
      "table_suggestions": ["table idea 1"]
    }
    `

    const completion = await client.chat.completions.create({
        messages: [{ role: "system", content: systemPrompt }],
        model: model,
        response_format: { type: "json_object" }
    })

    try {
        const result = JSON.parse(completion.choices[0].message.content || "{}")
        return {
            outline: result.outline || [],
            table_suggestions: result.table_suggestions || []
        }
    } catch (e) {
        console.error("Failed to parse body outline", e)
        return { outline: [], table_suggestions: [] }
    }
}

export async function generateBody(keyword: string, titleMeta: GeneratedTitleAndMeta, outline: string[], ingredients: string): Promise<string> {
    const { client, model } = await getOpenAIClient()
    const customPrompts = await getCustomPrompts()

    const systemPrompt = `${customPrompts.article} Write the body content (excluding intro/conclusion).
    Context:
    - Keyword: ${keyword}
    - Title: ${titleMeta.title}
    - Outline: ${outline.join(", ")}
    - Ingredients: ${ingredients}
    
    Instructions:
    - Write one short section per outline point.
    - Use HTML tags: <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <table>.
    - NO markdown, NO <section> tags.
    - Valid HTML only.
    `

    const completion = await client.chat.completions.create({
        messages: [{ role: "system", content: systemPrompt }],
        model: model,
    })

    return completion.choices[0].message.content || ""
}

export async function generateConclusion(keyword: string, titleMeta: GeneratedTitleAndMeta, bio: string): Promise<string> {
    const { client, model } = await getOpenAIClient()

    const systemPrompt = `You are a trusted food blogger Use warm, playful voice.
    Context:
    - Keyword: ${keyword}
    - Title: ${titleMeta.title}
    - Bio: ${bio}
    
    Task: Write an HTML conclusion (30-40 words).
    - Para 1: Recipe Recap.
    - Para 2: Expert Tips.
    - Para 3: Call to Action.
    
    Output: Valid HTML only (using <h2> and <p> tags).
    `

    const completion = await client.chat.completions.create({
        messages: [{ role: "system", content: systemPrompt }],
        model: model,
    })

    return completion.choices[0].message.content || ""
}

export async function generateExpertBlock(keyword: string, recipeTitle: string, expertPersona: string): Promise<string> {
    const { client, model } = await getOpenAIClient()

    const systemPrompt = `You are ${expertPersona || "a culinary expert"}. Write a short, credible "Expert Says" paragraph (3-4 lines) for a recipe blog post.
    - Recipe: ${recipeTitle}
    - Keyword: ${keyword}
    - Output clean HTML: <h2>Expert Quote</h2> followed by a <p> block.
    - Mention the keyword naturally.
    - Sound authoritative but friendly.
    `

    const completion = await client.chat.completions.create({
        messages: [{ role: "system", content: systemPrompt }],
        model: model,
    })

    return completion.choices[0].message.content || ""
}

export async function generatePersonalBlock(keyword: string, recipeTitle: string, authorBio: string): Promise<string> {
    const { client, model } = await getOpenAIClient()

    const systemPrompt = `You are ${authorBio || "a friendly food blogger"}. Write a warm, personal story or insight about this recipe.
    - Recipe: ${recipeTitle}
    - Keyword: ${keyword}
    - Output clean HTML: <h2>Personal Touch</h2> followed by a <p> block with an anecdote.
    - Length: Max 3-4 lines.
    - Mention the keyword naturally.
    `

    const completion = await client.chat.completions.create({
        messages: [{ role: "system", content: systemPrompt }],
        model: model,
    })

    return completion.choices[0].message.content || ""
}

export async function generateSocialBlocks(keyword: string, titleMeta: GeneratedTitleAndMeta): Promise<any> {
    const { client, model } = await getOpenAIClient()
    const customPrompts = await getCustomPrompts()

    const systemPrompt = `${customPrompts.pinterest} Generate content blocks for:
    1. Pinterest (Title and Description)
    2. Reddit (Post content)
    3. YouTube (Community post)
    
    Recipe: ${titleMeta.title}
    Keyword: ${keyword}
    
    Return JSON ONLY:
    {
      "pinterest": { "title": "...", "description": "..." },
      "reddit": "...",
      "youtube": "..."
    }
    `

    const completion = await client.chat.completions.create({
        messages: [{ role: "system", content: systemPrompt }],
        model: model,
        response_format: { type: "json_object" }
    })

    return JSON.parse(completion.choices[0].message.content || "{}")
}
