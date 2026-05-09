'use server'

import OpenAI from 'openai'
import { prisma } from '@/lib/prisma'
import { RecipeSchema, ImagePromptsArraySchema, RankMathSchema, Result, RecipeData, ImagePrompt, RankMathData } from '@/lib/types'
import { z } from 'zod';

// Helper to clean JSON string from markdown
function cleanJsonString(content: string): string {
    let cleaned = content.trim();
    if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/```json\n?/, '').replace(/```\n?$/, '');
    } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/```\n?/, '').replace(/```\n?$/, '');
    }
    return cleaned;
}

export async function generateRecipeData(keyword: string, aiModel: string, apiKey: string): Promise<Result<RecipeData>> {
    const client = new OpenAI({
        apiKey: apiKey,
        baseURL: "https://openrouter.ai/api/v1",
    })

    const prompt = `You are a helpful assistant that generates recipe data for a WordPress plugin.

Given: A recipe keyword/topic: "${keyword}"

Generate a complete, realistic recipe with proper measurements and instructions.

Return ONLY a valid JSON object (no markdown, no backticks) in this exact format:

{
  "title": "Short catchy recipe name (10-30 characters)",
  "description": "Brief appetizing description (30-40 words)",
  "ingredients": ["Ingredient 1 with measurement", "Ingredient 2 with measurement", "..."],
  "instructions": ["Step 1: Detailed instruction", "Step 2: Detailed instruction", "..."],
  "notes": "Optional chef tips or substitutions",
  "prep_time": "10 minutes",
  "cook_time": "25 minutes",
  "total_time": "35 minutes",
  "yield": "Serves 4",
  "category": "e.g., Dessert, Main Course, Appetizer",
  "method": "e.g., Baked, Fried, Grilled, No-Bake",
  "cuisine": "e.g., American, Italian, Mexican",
  "diet": "e.g., Vegetarian, Vegan, Gluten-Free, or leave empty",
  "serving_size": "1 slice/serving",
  "calories": "250",
  "protein": "5g",
  "carbohydrates": "35g",
  "fat": "10g",
  "sugar": "20g",
  "fiber": "2g",
  "sodium": "300mg"
}

Guidelines:
- Make it realistic and achievable for home cooks
- Use standard US measurements
- Instructions should be clear and detailed
- Nutrition should be reasonable estimates
- Make it appealing to busy American home cooks (women 25-55)

Return ONLY the JSON object, nothing else.`

    try {
        const response = await client.chat.completions.create({
            model: aiModel,
            messages: [
                { role: 'system', content: 'You are a professional recipe developer. Return only valid JSON.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.7,
        })

        const content = response.choices[0]?.message?.content || '{}'
        const cleaned = cleanJsonString(content);

        try {
            const parsed = JSON.parse(cleaned);
            const validated = RecipeSchema.parse(parsed);
            return { success: true, data: validated };
        } catch (validationError: any) {
            console.error('Validation error for recipe:', validationError);
            return { success: false, error: `Invalid JSON format or schema: ${validationError.message}` };
        }

    } catch (error: any) {
        console.error('Recipe generation error:', error)
        return { success: false, error: error.message }
    }
}

export async function generateImagePrompts(keyword: string, recipeTitle: string, ingredients: string[], aiModel: string, apiKey: string): Promise<Result<ImagePrompt[]>> {
    const client = new OpenAI({
        apiKey: apiKey,
        baseURL: "https://openrouter.ai/api/v1",
    })

    const ingredientsList = ingredients.slice(0, 5).join(', ')

    const prompt = `Act as an expert food photography specialist. Generate 3 detailed image prompts for DALL-E focused on: "${recipeTitle}" (keyword: ${keyword})

Key ingredients: ${ingredientsList}

Style Requirements:
- Professional food photography
- Natural lighting, clean composition
- Warm, appetizing colors
- High resolution
- White cloth/napkin staging with clear glass of water

Generate exactly 3 images:

1. **Hero/Featured Image**: Eye-catching finished dish
2. **Ingredients Prep**: Organized ingredients layout
3. **Final Plated**: Beautifully plated dish ready to serve

Return ONLY a valid JSON array (no markdown, no backticks):

[
  {
    "type": "featured",
    "prompt": "Professional food photography of [DISH] beautifully presented on white cloth, clear glass of water beside it, natural lighting, clean table, appetizing composition",
    "alt_text": "Delicious ${keyword} recipe - perfectly prepared and ready to serve",
    "caption": "${recipeTitle} - A stunning homemade dish"
  },
  {
    "type": "ingredients",
    "prompt": "Overhead shot of ${keyword} ingredients neatly arranged on clean white surface, including ${ingredientsList}, natural lighting, organized prep scene",
    "alt_text": "Fresh ingredients for making ${keyword}",
    "caption": "Everything you need for ${recipeTitle}"
  },
  {
    "type": "final",
    "prompt": "Beautifully plated ${keyword} on elegant white plate with white napkin, clear water glass, perfect lighting, professional food photography style",
    "alt_text": "Finished ${keyword} recipe plated and ready to enjoy",
    "caption": "${recipeTitle} - The perfect result"
  }
]

Keep prompts under 200 characters. Make them vivid and specific.`

    try {
        const response = await client.chat.completions.create({
            model: aiModel,
            messages: [
                { role: 'system', content: 'You are a food photography expert. Return only valid JSON.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.7,
        })

        const content = response.choices[0]?.message?.content || '[]'
        const cleaned = cleanJsonString(content);

        try {
            const parsed = JSON.parse(cleaned);
            const validated = ImagePromptsArraySchema.parse(parsed);
            return { success: true, data: validated };
        } catch (validationError: any) {
            console.error('Validation error for image prompts:', validationError);
            return { success: false, error: `Invalid JSON format or schema: ${validationError.message}` };
        }

    } catch (error: any) {
        console.error('Image prompt generation error:', error)
        return { success: false, error: error.message }
    }
}

export async function generateRankMathData(keyword: string, recipeTitle: string, aiModel: string, apiKey: string): Promise<Result<RankMathData>> {
    const client = new OpenAI({
        apiKey: apiKey,
        baseURL: "https://openrouter.ai/api/v1",
    })

    const prompt = `Generate Rank Math SEO data for a recipe blog post.

Recipe: "${recipeTitle}"
Main Keyword: "${keyword}"

Return ONLY valid JSON (no markdown):

{
  "focus_keyword": "${keyword}",
  "seo_title": "SEO-optimized title (50-60 chars, starts with keyword)",
  "seo_description": "Meta description (145-160 chars, includes keyword, compelling)",
  "pillar_content": false,
  "schema_type": "Recipe",
  "faq_items": [
    {
      "question": "Relevant question about ${keyword}",
      "answer": "Helpful answer (2-3 sentences)"
    }
  ]
}

Make 3-5 FAQs that are genuinely helpful.`

    try {
        const response = await client.chat.completions.create({
            model: aiModel,
            messages: [
                { role: 'system', content: 'You are an SEO expert. Return only valid JSON.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.5,
        })

        const content = response.choices[0]?.message?.content || '{}'
        const cleaned = cleanJsonString(content);

        try {
            const parsed = JSON.parse(cleaned);
            const validated = RankMathSchema.parse(parsed);
            return { success: true, data: validated };
        } catch (validationError: any) {
            console.error('Validation error for Rank Math data:', validationError);
            return { success: false, error: `Invalid JSON format or schema: ${validationError.message}` };
        }

    } catch (error: any) {
        console.error('Rank Math data generation error:', error)
        return { success: false, error: error.message }
    }
}
