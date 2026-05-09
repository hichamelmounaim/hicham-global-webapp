import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-2xl text-sm font-black uppercase tracking-widest transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97] select-none",
    {
        variants: {
            variant: {
                default: "bg-primary text-on-primary shadow-lg shadow-primary/20 hover:scale-[1.02] hover:shadow-primary/40",
                destructive:
                    "bg-error text-on-error shadow-lg shadow-error/20 hover:bg-error/90",
                outline:
                    "border border-outline-variant/20 bg-transparent hover:bg-surface-container-high hover:border-outline-variant/40 hover:text-foreground",
                secondary:
                    "bg-secondary text-on-secondary shadow-lg shadow-secondary/20 hover:scale-[1.02] hover:shadow-secondary/40",
                tertiary:
                    "bg-tertiary text-on-tertiary shadow-lg shadow-tertiary/20 hover:scale-[1.02] hover:shadow-tertiary/40",
                ghost: "hover:bg-surface-container-high text-foreground/60 hover:text-foreground",
                link: "text-primary underline-offset-4 hover:underline",
                glass: "bg-surface-container-low/40 backdrop-blur-md border border-outline-variant/10 text-foreground hover:bg-surface-container-high/60 transition-all",
                neon: "bg-background border border-primary/50 text-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)] hover:shadow-[0_0_25px_rgba(var(--primary-rgb),0.5)] hover:bg-primary/5",
            },
            size: {
                default: "h-12 px-6 py-3",
                sm: "h-10 rounded-xl px-4 text-[10px]",
                lg: "h-14 rounded-3xl px-10 text-base",
                icon: "h-11 w-11 rounded-xl",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button"
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button, buttonVariants }
