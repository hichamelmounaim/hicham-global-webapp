'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { validateOpenRouterKey } from "@/app/actions/validate-keys"

interface KeyValidatorProps {
    apiKey: string
}

export function KeyValidator({ apiKey }: KeyValidatorProps) {
    const [validating, setValidating] = useState(false)
    const [result, setResult] = useState<{ valid: boolean; message?: string; error?: string } | null>(null)

    async function handleTest() {
        setValidating(true)
        setResult(null)

        const response = await validateOpenRouterKey(apiKey)
        setResult(response)
        setValidating(false)
    }

    return (
        <div className="space-y-2">
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTest}
                disabled={validating || !apiKey}
            >
                {validating ? 'Testing...' : 'Test Connection'}
            </Button>

            {result && (
                <p className={`text-sm ${result.valid ? 'text-green-500' : 'text-red-500'}`}>
                    {result.valid ? `✓ ${result.message}` : `✗ ${result.error}`}
                </p>
            )}
        </div>
    )
}
