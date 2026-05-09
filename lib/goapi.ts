import axios from "axios"
import { prisma } from "@/lib/prisma"

export async function midjourneyImagine(prompt: string) {
    const settings = await prisma.settings.findFirst()
    if (!settings?.goapiKey) throw new Error("GoAPI Key not configured")

    const response = await axios.post(
        "https://api.goapi.ai/api/v1/task",
        {
            model: "midjourney",
            task_type: "imagine",
            input: {
                prompt: prompt,
                aspect_ratio: "1:1",
                process_mode: "relax",
                skip_prompt_check: true,
            },
        },
        {
            headers: {
                "X-API-KEY": settings.goapiKey,
                "Content-Type": "application/json",
            },
        }
    )

    return response.data // Contains task_id
}

export async function checkMidjourneyTask(taskId: string) {
    const settings = await prisma.settings.findFirst()
    if (!settings?.goapiKey) throw new Error("GoAPI Key not configured")

    const response = await axios.get(
        `https://api.goapi.ai/api/v1/task/${taskId}`,
        {
            headers: {
                "X-API-KEY": settings.goapiKey,
            },
        }
    )

    return response.data
}
