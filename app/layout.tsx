import type { Metadata } from "next";
import { Space_Grotesk, Manrope } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";

const spaceGrotesk = Space_Grotesk({ 
    subsets: ["latin"],
    variable: "--font-space-grotesk",
});

const manrope = Manrope({ 
    subsets: ["latin"],
    variable: "--font-manrope",
});

export const metadata: Metadata = {
    title: "Hicham Global V2",
    description: "Advanced Content Automation",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className={`${spaceGrotesk.variable} ${manrope.variable}`} suppressHydrationWarning>
            <body
                className={`${manrope.className} antialiased min-h-screen bg-background text-foreground selection:bg-primary/30 font-sans`}
                suppressHydrationWarning
            >
                <Providers>
                    <div className="flex min-h-screen">
                        <Sidebar />
                        <main className="lg:ml-56 flex-1 min-h-screen">
                            <div className="p-4 md:p-8 pb-24 lg:pb-8 animate-in fade-in duration-300">
                                {children}
                            </div>
                        </main>
                    </div>
                    <Toaster richColors position="top-right" />
                </Providers>
            </body>
        </html>
    );
}
