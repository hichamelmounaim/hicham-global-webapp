import axios from "axios"
import { prisma } from "@/lib/prisma"

export async function publishToWordPress(postData: any, site: { wpUrl: string, wpUser: string, wpAppPass: string }) {
    const auth = Buffer.from(`${site.wpUser}:${site.wpAppPass}`).toString("base64")
    const headers = {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
    }

    // Create Post
    const response = await axios.post(
        `${site.wpUrl}/wp-json/wp/v2/posts`,
        {
            title: postData.title,
            content: postData.html,
            status: "draft",
            slug: postData.slug,
            featured_media: postData.featured_media || undefined,
            meta: {
                rank_math_title: postData.rankMath?.seo_title,
                rank_math_description: postData.rankMath?.seo_description,
                rank_math_focus_keyword: postData.rankMath?.focus_keyword,
            }
        },
        { headers }
    )

    return response.data
}
