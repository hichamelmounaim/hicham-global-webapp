import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
    extends React.TextareaHTMLAttributes<HTMLTextAreaElement> { }

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, ...props }, ref) => {
        return (
            <textarea
                className={cn(
                    "flex min-h-[80px] w-full rounded-2xl border border-outline-variant/10 bg-surface-container-high/40 px-4 py-3 text-sm font-bold tracking-tight text-foreground placeholder:text-foreground/20 placeholder:font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-secondary/30 focus-visible:border-secondary/40 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 hover:bg-surface-container-high/60",
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
Textarea.displayName = "Textarea"

export { Textarea }
