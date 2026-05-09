import { z } from 'zod';

// Generic result type for server actions
export type Result<T> =
    | { success: true; data: T; message?: string }
    | { success: false; error: string };

// Recipe Schema
export const RecipeSchema = z.object({
    title: z.string().min(5).max(100),
    description: z.string(),
    ingredients: z.array(z.string()),
    instructions: z.array(z.string()),
    notes: z.string().optional(),
    prep_time: z.string(),
    cook_time: z.string(),
    total_time: z.string(),
    yield: z.string(),
    category: z.string(),
    method: z.string(),
    cuisine: z.string(),
    diet: z.string().optional(),
    serving_size: z.string(),
    calories: z.string().optional(),
    protein: z.string().optional(),
    carbohydrates: z.string().optional(),
    fat: z.string().optional(),
    sugar: z.string().optional(),
    fiber: z.string().optional(),
    sodium: z.string().optional(),
});

export type RecipeData = z.infer<typeof RecipeSchema>;

// Image Prompt Schema
export const ImagePromptSchema = z.object({
    type: z.enum(['featured', 'ingredients', 'final', 'final_dish']), // normalized types
    prompt: z.string().max(1000),
    alt_text: z.string(),
    caption: z.string(),
});

export const ImagePromptsArraySchema = z.array(ImagePromptSchema);
export type ImagePrompt = z.infer<typeof ImagePromptSchema>;

// Rank Math Schema
export const RankMathSchema = z.object({
    focus_keyword: z.string(),
    seo_title: z.string(),
    seo_description: z.string(),
    pillar_content: z.boolean().optional().default(false),
    schema_type: z.string().optional().default('Recipe'),
    faq_items: z.array(z.object({
        question: z.string(),
        answer: z.string(),
    })).optional().default([]),
});

export type RankMathData = z.infer<typeof RankMathSchema>;

// Content Schema (for the post content JSON)
export const PostContentSchema = z.object({
    title: z.string().optional(),
    slug: z.string().optional(),
    meta_description: z.string().optional(),
    tags: z.string().optional(),
    keywords: z.string().optional(),
    intro: z.string().optional(),
    body: z.string().optional(),
    conclusion: z.string().optional(),
    expertContent: z.string().optional(),
    personalContent: z.string().optional(),
    socialContent: z.string().optional(), // JSON string or object
    batchId: z.string().optional(),
}).passthrough();

export type PostContent = z.infer<typeof PostContentSchema>;
