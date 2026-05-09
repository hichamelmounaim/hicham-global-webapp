"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Play, Loader2, Pause, RotateCw } from "lucide-react"
import { processPostStep } from "@/app/actions/process"
import { useRouter } from "next/navigation"

interface Post {
    id: string
    status: string
    step: number
}

interface BatchProcessorProps {
    batchId: string
    posts: Post[]
}

export function BatchProcessor({ batchId, posts }: BatchProcessorProps) {
    const [processing, setProcessing] = useState(false)
    const processingRef = useRef(false)
    const router = useRouter()

    const startProcessing = async () => {
        if (processing) return
        setProcessing(true)
        processingRef.current = true

        // We iterate through all posts that are not done
        // Using a for loop allows us to sequence the API calls
        for (const post of posts) {
            if (post.status === "DONE" || post.status === "ERROR") continue

            let done = false
            let currentStep = post.step

            // Loop until this specific post is complete
            while (!done) {
                if (!processingRef.current) {
                    setProcessing(false)
                    return // Stop everything
                }

                try {
                    const result = await processPostStep(post.id)
                    if (result.done) done = true

                    // Refresh UI to show progress bar updates
                    router.refresh()

                    // Wait a bit to avoid hammering and allow UI update
                    await new Promise(r => setTimeout(r, 1000))
                } catch (e) {
                    console.error(e)
                    done = true // Skip this post on error
                }
            }
        }

        setProcessing(false)
        processingRef.current = false
    }

    const stopProcessing = () => {
        processingRef.current = false
        setProcessing(false)
        router.refresh()
    }

    return (
        <div className="flex gap-2">
            {!processing ? (
                <Button size="lg" className="gap-2" onClick={startProcessing}>
                    <Play className="h-4 w-4" />
                    Start Processing
                </Button>
            ) : (
                <Button size="lg" variant="destructive" className="gap-2" onClick={stopProcessing}>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing... (Click to Stop)
                </Button>
            )}
        </div>
    )
}
