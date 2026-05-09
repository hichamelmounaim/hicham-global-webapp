import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> { }

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, ...props }, ref) => {
        return (
            <input
                type={type}
                className={cn(
                    "flex h-12 w-full rounded-2xl border border-outline-variant/10 bg-surface-container-high/40 px-4 py-2 text-sm font-bold tracking-tight text-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-black placeholder:text-foreground/20 placeholder:font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-secondary/30 focus-visible:border-secondary/40 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 hover:bg-surface-container-high/60",
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
Input.displayName = "Input"

export { Input }
