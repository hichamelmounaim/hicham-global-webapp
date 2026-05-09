'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { testGenerateRecipe } from '@/app/actions/test-generate'
import { Loader2 } from 'lucide-react'

interface TestGenerateButtonProps {
    postId: string
}

export function TestGenerateButton({ postId }: TestGenerateButtonProps) {
    const [isPending, startTransition] = useTransition()
    const [result, setResult] = useState<any>(null)

    const handleGenerate = () => {
        setResult(null)
        startTransition(async () => {
            const res = await testGenerateRecipe(postId)
            setResult(res)

            if (res.success) {
                // Refresh the page to show new data
                window.location.reload()
            }
        })
    }

    return (
        <div className="space-y-2">
            <Button
                variant="default"
                onClick={handleGenerate}
                disabled={isPending}
                className="w-full"
            >
                {isPending ? (
                    <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating Recipe & Images...
                    </>
                ) : (
                    'Generate Recipe + Images + SEO'
                )}
            </Button>

            {result && (
                <div className={`text-sm p-3 rounded ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {result.success ? (
                        <div>
                            <p className="font-semibold">✓ Success!</p>
                            <p>{result.message}</p>
                            {result.data && (
                                <p className="text-xs mt-1">
                                    Recipe: {result.data.recipe} | Images: {result.data.images} | SEO: {result.data.seo ? 'Yes' : 'No'}
                                </p>
                            )}
                        </div>
                    ) : (
                        <div>
                            <p className="font-semibold">✗ Error</p>
                            <p>{result.error}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
