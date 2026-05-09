'use client'

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { motion } from "framer-motion"

export function ThemeToggle() {
    const { theme, setTheme, resolvedTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return <div className="w-full h-10 rounded-xl bg-surface-container-high animate-pulse" />
    }

    const isDark = resolvedTheme === "dark"

    return (
        <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="relative flex items-center justify-between w-full p-1.5 rounded-xl bg-surface-container-high border border-outline-variant/10 cursor-pointer overflow-hidden group"
        >
            <div className="flex items-center gap-2 z-10 px-2 py-1">
                <Sun className={`h-4 w-4 transition-colors ${!isDark ? 'text-primary' : 'text-foreground/40'}`} />
                <span className={`text-xs font-bold transition-colors ${!isDark ? 'text-foreground' : 'text-foreground/40'}`}>Light</span>
            </div>
            
            <div className="flex items-center gap-2 z-10 px-2 py-1">
                <span className={`text-xs font-bold transition-colors ${isDark ? 'text-foreground' : 'text-foreground/40'}`}>Dark</span>
                <Moon className={`h-4 w-4 transition-colors ${isDark ? 'text-violet-400' : 'text-foreground/40'}`} />
            </div>

            <motion.div
                className="absolute inset-y-1.5 w-[calc(50%-6px)] bg-background rounded-lg shadow-md border border-outline-variant/5 z-0"
                initial={false}
                animate={{
                    left: isDark ? "50%" : "6px",
                }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
        </button>
    )
}
