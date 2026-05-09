import { BookOpen, Zap, FolderKanban, FileText, Layers, Globe, BarChart2, Settings, Shield, Rocket, Clock, Play, ArrowRight, Key, MessageSquare, Image as ImageIcon, Sparkles } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
    title: 'Documentation | Hicham Global',
    description: 'Complete guide to using the Hicham Global Content Automation Engine v2.0',
}

function Section({ id, icon: Icon, title, color, children }: { id: string; icon: React.ElementType; title: string; color: string; children: React.ReactNode }) {
    return (
        <section id={id} className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
                <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
                    <Icon className="h-5 w-5" />
                </div>
                <h2 className="text-2xl font-black tracking-tight uppercase font-display">{title}</h2>
            </div>
            <div className="space-y-4 text-foreground/80 text-sm leading-relaxed">{children}</div>
        </section>
    )
}

function StepCard({ step, title, children }: { step: number; title: string; children: React.ReactNode }) {
    return (
        <div className="flex gap-4 items-start">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-sm flex-shrink-0 mt-0.5">
                {step}
            </div>
            <div>
                <h4 className="font-bold text-foreground mb-1">{title}</h4>
                <div className="text-foreground/60 text-sm leading-relaxed">{children}</div>
            </div>
        </div>
    )
}

function FeatureCard({ icon: Icon, title, description, href, color }: { icon: React.ElementType; title: string; description: string; href: string; color: string }) {
    return (
        <Link href={href}>
            <div className={`group rounded-2xl border border-outline-variant/10 bg-surface-container-low p-5 hover:bg-surface-container-high transition-all cursor-pointer`}>
                <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="h-4 w-4" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{title}</h3>
                        <p className="text-xs text-foreground/40 mt-1 leading-relaxed">{description}</p>
                    </div>
                </div>
            </div>
        </Link>
    )
}

function KeyBadge({ children }: { children: React.ReactNode }) {
    return <code className="text-[11px] bg-surface-container-high px-2 py-0.5 rounded-md text-primary font-mono font-bold border border-outline-variant/10">{children}</code>
}

export default function DocsPage() {
    return (
        <div className="max-w-4xl space-y-16 pb-20">
            {/* ═══════════ HERO ═══════════ */}
            <div className="space-y-4 pt-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center shadow-lg shadow-primary/20">
                        <BookOpen className="h-6 w-6 text-on-primary" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black tracking-tight uppercase font-display italic">
                            DOCS <span className="text-primary">GUIDE</span>
                        </h1>
                        <p className="text-sm text-foreground/40 font-medium mt-0.5">Hicham Global — Content Automation Engine v2.0</p>
                    </div>
                </div>
                <p className="text-foreground/60 text-sm max-w-2xl leading-relaxed">
                    This guide covers every feature of the application. From initial setup to running automated campaigns, everything you need is documented below.
                </p>
            </div>

            {/* ═══════════ TABLE OF CONTENTS ═══════════ */}
            <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-foreground/40 mb-4">Table of Contents</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {[
                        { href: '#getting-started', label: '1. Getting Started', icon: Rocket },
                        { href: '#dashboard', label: '2. Dashboard (Home)', icon: Sparkles },
                        { href: '#settings', label: '3. Settings & API Keys', icon: Settings },
                        { href: '#sites', label: '4. WordPress Sites', icon: Globe },
                        { href: '#projects', label: '5. Projects & Batches', icon: FolderKanban },
                        { href: '#articles', label: '6. Articles (Posts)', icon: FileText },
                        { href: '#pillar', label: '7. Pillar Articles', icon: Layers },
                        { href: '#campaigns', label: '8. Campaigns (Drip)', icon: Zap },
                        { href: '#analytics', label: '9. Analytics', icon: BarChart2 },
                        { href: '#admin', label: '10. Admin Panel', icon: Shield },
                    ].map((item) => (
                        <a key={item.href} href={item.href} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-surface-container-high transition-colors group">
                            <item.icon className="h-4 w-4 text-foreground/30 group-hover:text-primary transition-colors" />
                            <span className="text-sm font-bold text-foreground/70 group-hover:text-foreground transition-colors">{item.label}</span>
                        </a>
                    ))}
                </div>
            </div>

            {/* ═══════════ 1. GETTING STARTED ═══════════ */}
            <Section id="getting-started" icon={Rocket} title="Getting Started" color="bg-green-500/10 text-green-400 border border-green-500/20">
                <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6 space-y-6">
                    <StepCard step={1} title="Sign In">
                        <p>Go to <KeyBadge>/sign-in</KeyBadge> and use your admin credentials. Default login:</p>
                        <div className="mt-2 p-3 rounded-xl bg-surface-container-high border border-outline-variant/10 font-mono text-xs space-y-1">
                            <p><span className="text-primary">Email:</span> hicham@admin.com</p>
                            <p><span className="text-primary">Password:</span> admin123</p>
                        </div>
                    </StepCard>

                    <StepCard step={2} title="Configure API Keys">
                        <p>Navigate to <Link href="/settings" className="text-primary hover:underline font-bold">Settings → Endpoints</Link> and enter your OpenRouter API key. This powers all AI content generation.</p>
                    </StepCard>

                    <StepCard step={3} title="Connect a WordPress Site">
                        <p>Go to <Link href="/sites" className="text-primary hover:underline font-bold">Sites</Link> and add your WordPress site URL, username, and application password. This is where your content gets published.</p>
                    </StepCard>

                    <StepCard step={4} title="Create Your First Batch">
                        <p>Navigate to <Link href="/projects/new" className="text-primary hover:underline font-bold">Projects → New Batch</Link>, enter a batch name, select your site, and paste your keywords (one per line). Click "Create Batch & Queue Jobs" to begin.</p>
                    </StepCard>
                </div>
            </Section>

            {/* ═══════════ 2. DASHBOARD ═══════════ */}
            <Section id="dashboard" icon={Sparkles} title="Dashboard (Home)" color="bg-primary/10 text-primary border border-primary/20">
                <p>The <Link href="/" className="text-primary hover:underline font-bold">Dashboard</Link> is your command center. It shows at a glance:</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    {[
                        { title: 'Total Library', desc: 'Total number of articles (posts) across all batches.' },
                        { title: 'Active Jobs', desc: 'How many posts are currently being generated right now.' },
                        { title: 'Success Rate', desc: 'Percentage of posts that completed without errors.' },
                    ].map((stat) => (
                        <div key={stat.title} className="rounded-xl border border-outline-variant/10 bg-surface-container-low p-4">
                            <h4 className="font-bold text-xs text-primary uppercase tracking-wider">{stat.title}</h4>
                            <p className="text-xs text-foreground/50 mt-1">{stat.desc}</p>
                        </div>
                    ))}
                </div>
                <p className="mt-4">Below the stats, you'll see your <strong>5 most recent batches</strong> and quick action links to create new batches, configure settings, or manage sites.</p>
            </Section>

            {/* ═══════════ 3. SETTINGS ═══════════ */}
            <Section id="settings" icon={Settings} title="Settings & API Keys" color="bg-secondary/10 text-secondary border border-secondary/20">
                <p>The <Link href="/settings" className="text-primary hover:underline font-bold">Settings</Link> page has three tabs:</p>

                <div className="space-y-6 mt-4">
                    {/* Endpoints Tab */}
                    <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6 space-y-4">
                        <div className="flex items-center gap-2">
                            <Key className="h-4 w-4 text-secondary" />
                            <h3 className="font-black text-sm uppercase tracking-wider">Tab 1: Endpoints</h3>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <h4 className="font-bold text-xs text-foreground/70">OpenRouter API Key</h4>
                                <p className="text-xs text-foreground/50">Your main AI provider. Get a key from <a href="https://openrouter.ai" target="_blank" className="text-primary hover:underline">openrouter.ai</a>. Paste it and click <strong>"Test Sync"</strong> to verify. Once connected, you can pick from hundreds of AI models (GPT-4o, Claude, Gemini, Llama, etc.).</p>
                            </div>
                            <div>
                                <h4 className="font-bold text-xs text-foreground/70">AI Model Selection</h4>
                                <p className="text-xs text-foreground/50">After entering a valid OpenRouter key, a dropdown lets you search and select any AI model. The model powers all content generation (titles, body text, SEO data, etc.).</p>
                            </div>
                            <div>
                                <h4 className="font-bold text-xs text-foreground/70">Image Provider</h4>
                                <p className="text-xs text-foreground/50">Choose between <strong>GoAPI</strong> (Midjourney proxy), <strong>TTAPI</strong>, or <strong>LinkrAPI</strong> for AI image generation. Each article gets featured images, ingredient shots, and final plated images auto-generated.</p>
                            </div>
                            <div>
                                <h4 className="font-bold text-xs text-foreground/70">Author Bio & Expert Persona</h4>
                                <p className="text-xs text-foreground/50">Set an author bio and expert persona. These get injected into every generated article to add a personal/professional touch — improving E-E-A-T signals for SEO.</p>
                            </div>
                        </div>
                    </div>

                    {/* Logic Tab */}
                    <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6 space-y-4">
                        <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-secondary" />
                            <h3 className="font-black text-sm uppercase tracking-wider">Tab 2: Logic (Prompts)</h3>
                        </div>
                        <p className="text-xs text-foreground/50">Create and manage <strong>Prompt Groups</strong> — named collections of system prompts that define how your content gets generated. Each group contains multiple prompt templates for different generation steps (title, body, recipe, social content, etc.). You can switch between groups to produce different content styles.</p>
                    </div>

                    {/* Publishing Tab */}
                    <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6 space-y-4">
                        <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-secondary" />
                            <h3 className="font-black text-sm uppercase tracking-wider">Tab 3: Publishing (Sites)</h3>
                        </div>
                        <p className="text-xs text-foreground/50">View all connected WordPress sites. You can also manage sites from the dedicated <Link href="/sites" className="text-primary hover:underline font-bold">Sites page</Link>.</p>
                    </div>
                </div>
            </Section>

            {/* ═══════════ 4. SITES ═══════════ */}
            <Section id="sites" icon={Globe} title="WordPress Sites" color="bg-tertiary/10 text-tertiary border border-tertiary/20">
                <p>The <Link href="/sites" className="text-primary hover:underline font-bold">Sites</Link> page manages your WordPress connections. You can connect multiple sites and assign different sites to different batches.</p>

                <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6 space-y-4 mt-4">
                    <h3 className="font-black text-sm uppercase tracking-wider">How to connect a WordPress site:</h3>
                    <div className="space-y-4">
                        <StepCard step={1} title="Get your WordPress URL">
                            <p>The base URL of your WordPress site (e.g., <KeyBadge>https://yoursite.com</KeyBadge>).</p>
                        </StepCard>
                        <StepCard step={2} title="Create an Application Password">
                            <p>In your WordPress admin, go to <strong>Users → Profile → Application Passwords</strong>. Create a new password and copy it.</p>
                        </StepCard>
                        <StepCard step={3} title="Add the site">
                            <p>Click <strong>"Add Site"</strong>, fill in the name, URL, username, and application password. Mark one site as <strong>Default</strong> — it will be pre-selected when creating batches.</p>
                        </StepCard>
                    </div>
                </div>
            </Section>

            {/* ═══════════ 5. PROJECTS ═══════════ */}
            <Section id="projects" icon={FolderKanban} title="Projects & Batches" color="bg-primary/10 text-primary border border-primary/20">
                <p><Link href="/projects" className="text-primary hover:underline font-bold">Projects</Link> shows all your content batches. A <strong>Batch</strong> is a collection of keywords that get processed into full articles.</p>

                <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6 space-y-4 mt-4">
                    <h3 className="font-black text-sm uppercase tracking-wider">Creating a Batch</h3>
                    <div className="space-y-4">
                        <StepCard step={1} title="Name your batch">
                            <p>Give it a descriptive name like "Chocolate Recipes — May 2026".</p>
                        </StepCard>
                        <StepCard step={2} title="Select a WordPress site">
                            <p>Choose which site the articles will be published to.</p>
                        </StepCard>
                        <StepCard step={3} title="Paste keywords">
                            <p>Enter one keyword per line. Each keyword becomes one full article. Examples:</p>
                            <div className="mt-2 p-3 rounded-xl bg-surface-container-high border border-outline-variant/10 font-mono text-xs space-y-1 text-foreground/60">
                                <p>easy chocolate chip cookies</p>
                                <p>best banana bread recipe</p>
                                <p>homemade mac and cheese</p>
                            </div>
                        </StepCard>
                        <StepCard step={4} title="Process the batch">
                            <p>After creating, go to the batch detail page and click <strong>"Process All"</strong>. The engine will generate content step-by-step: Title → Body → Images → Publish to WordPress.</p>
                        </StepCard>
                    </div>
                </div>

                <div className="rounded-xl border border-primary/10 bg-primary/5 p-4 mt-4">
                    <p className="text-xs text-primary/80"><strong>Progress Tracking:</strong> Each post shows a progress bar (4 steps: Title → Content → Images → Publish). Statuses: <KeyBadge>QUEUED</KeyBadge> → <KeyBadge>PROCESSING</KeyBadge> → <KeyBadge>DONE</KeyBadge> or <KeyBadge>ERROR</KeyBadge>.</p>
                </div>
            </Section>

            {/* ═══════════ 6. ARTICLES ═══════════ */}
            <Section id="articles" icon={FileText} title="Articles (Posts)" color="bg-secondary/10 text-secondary border border-secondary/20">
                <p><Link href="/posts" className="text-primary hover:underline font-bold">Articles</Link> shows all generated content across all batches. Click any article to see:</p>
                <ul className="space-y-2 mt-3 ml-4">
                    {[
                        ['SEO & Metadata', 'Title, slug, meta description, tags, and keywords'],
                        ['Generated Images', 'Featured image, ingredients prep shot, and final plated image'],
                        ['Recipe Card', 'Prep/cook times, yield, ingredients list, and nutrition data'],
                        ['Rank Math SEO', 'Focus keyword, SEO title, SEO description, and FAQ schema'],
                        ['Full Content', 'Introduction, body (HTML), and conclusion sections'],
                        ['WordPress Link', 'Direct link to the published post on your WordPress site'],
                    ].map(([title, desc]) => (
                        <li key={title} className="flex items-start gap-2">
                            <ArrowRight className="h-3 w-3 text-secondary mt-1 flex-shrink-0" />
                            <span><strong className="text-foreground">{title}</strong> — {desc}</span>
                        </li>
                    ))}
                </ul>
                <p className="mt-4">You can also <strong>Edit</strong> any article's content before or after publishing, and <strong>Re-process</strong> individual posts.</p>
            </Section>

            {/* ═══════════ 7. PILLAR ═══════════ */}
            <Section id="pillar" icon={Layers} title="Pillar Articles" color="bg-violet-500/10 text-violet-400 border border-violet-500/20">
                <p><Link href="/pillar" className="text-primary hover:underline font-bold">Pillar Articles</Link> are long-form comprehensive guides (3,000–5,000+ words). Unlike regular batch posts, pillar articles are built section-by-section for deeper content.</p>

                <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6 space-y-4 mt-4">
                    <h3 className="font-black text-sm uppercase tracking-wider">How it works</h3>
                    <div className="space-y-4">
                        <StepCard step={1} title="Create a pillar article">
                            <p>Enter a keyword and target word count. The AI generates a detailed outline with headings and subheadings.</p>
                        </StepCard>
                        <StepCard step={2} title="Generate section by section">
                            <p>Each section is written individually, then combined into the final article. This produces more focused, higher-quality long-form content.</p>
                        </StepCard>
                        <StepCard step={3} title="Publish to WordPress">
                            <p>Once all sections are complete, the full article is published to your selected WordPress site.</p>
                        </StepCard>
                    </div>
                </div>

                <div className="rounded-xl border border-violet-500/10 bg-violet-500/5 p-4 mt-4">
                    <p className="text-xs text-violet-400/80"><strong>Statuses:</strong> <KeyBadge>DRAFT</KeyBadge> → <KeyBadge>GENERATING</KeyBadge> → <KeyBadge>DONE</KeyBadge>. Word count is tracked in real-time against the target.</p>
                </div>
            </Section>

            {/* ═══════════ 8. CAMPAIGNS ═══════════ */}
            <Section id="campaigns" icon={Zap} title="Campaigns (Drip Publishing)" color="bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <p><Link href="/campaigns" className="text-primary hover:underline font-bold">Campaigns</Link> let you schedule content publication over time (drip-feed). Instead of publishing everything at once, articles get created and published on a schedule.</p>

                <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6 space-y-4 mt-4">
                    <h3 className="font-black text-sm uppercase tracking-wider">Setting up a Campaign</h3>
                    <div className="space-y-4">
                        <StepCard step={1} title="Campaign name & content type">
                            <p>Choose between <strong>Blog Posts</strong> (regular recipes) or <strong>Pillar Articles</strong> (long-form 4000+ word guides).</p>
                        </StepCard>
                        <StepCard step={2} title="Select WordPress site">
                            <p>Choose which site to publish to.</p>
                        </StepCard>
                        <StepCard step={3} title="Set the schedule">
                            <p><strong>Interval:</strong> How often to publish (every 1h, 6h, 12h, 24h, 48h, 72h, or weekly).<br />
                            <strong>Posts per run:</strong> How many articles to process each time (1–10).</p>
                        </StepCard>
                        <StepCard step={4} title="Add keywords">
                            <p>Paste your keyword list (one per line). Each becomes a queued article.</p>
                        </StepCard>
                        <StepCard step={5} title="Auto-publish toggle">
                            <p>When enabled, articles are automatically pushed to WordPress upon completion.</p>
                        </StepCard>
                    </div>
                </div>

                <div className="rounded-xl border border-amber-500/10 bg-amber-500/5 p-4 mt-4">
                    <p className="text-xs text-amber-400/80"><strong>Cron Trigger:</strong> Point an external cron scheduler to <KeyBadge>GET /api/cron</KeyBadge> to automatically process campaign queues. You can also trigger runs manually from each campaign's detail page.</p>
                </div>

                <div className="rounded-xl border border-outline-variant/10 bg-surface-container-low p-4 mt-3">
                    <p className="text-xs text-foreground/50"><strong>Campaign Statuses:</strong> <KeyBadge>ACTIVE</KeyBadge> (processing), <KeyBadge>PAUSED</KeyBadge> (on hold), <KeyBadge>COMPLETED</KeyBadge> (all items done), <KeyBadge>DRAFT</KeyBadge> (not started).</p>
                </div>
            </Section>

            {/* ═══════════ 9. ANALYTICS ═══════════ */}
            <Section id="analytics" icon={BarChart2} title="Analytics" color="bg-violet-500/10 text-violet-400 border border-violet-500/20">
                <p>The <Link href="/analytics" className="text-primary hover:underline font-bold">Analytics</Link> page gives you visibility into your content generation pipeline:</p>
                <ul className="space-y-2 mt-3 ml-4">
                    {[
                        ['Token Usage', 'Track how many prompt and completion tokens you\'re consuming across all operations'],
                        ['API Costs', 'See the estimated USD cost per model and per operation'],
                        ['Generation Performance', 'Monitor how many articles are processed and their success rates'],
                    ].map(([title, desc]) => (
                        <li key={title} className="flex items-start gap-2">
                            <ArrowRight className="h-3 w-3 text-violet-400 mt-1 flex-shrink-0" />
                            <span><strong className="text-foreground">{title}</strong> — {desc}</span>
                        </li>
                    ))}
                </ul>
            </Section>

            {/* ═══════════ 10. ADMIN ═══════════ */}
            <Section id="admin" icon={Shield} title="Admin Panel" color="bg-violet-500/10 text-violet-400 border border-violet-500/20">
                <p>If your account has the <KeyBadge>ADMIN</KeyBadge> role, you'll see an <strong>"Users"</strong> link in the sidebar under the Admin section.</p>
                <p className="mt-2">From the <Link href="/admin/users" className="text-primary hover:underline font-bold">Admin → Users</Link> page you can:</p>
                <ul className="space-y-2 mt-3 ml-4">
                    {[
                        'View all registered users',
                        'See user roles (ADMIN / USER)',
                        'Manage user access',
                    ].map((item) => (
                        <li key={item} className="flex items-start gap-2">
                            <ArrowRight className="h-3 w-3 text-violet-400 mt-1 flex-shrink-0" />
                            <span>{item}</span>
                        </li>
                    ))}
                </ul>
            </Section>

            {/* ═══════════ QUICK LINKS ═══════════ */}
            <div className="space-y-4">
                <h2 className="text-xl font-black tracking-tight uppercase font-display">Quick Links</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <FeatureCard icon={FolderKanban} title="Create New Batch" description="Start generating articles from keywords" href="/projects/new" color="bg-primary/10 text-primary" />
                    <FeatureCard icon={Settings} title="Configure Settings" description="Set up API keys and AI models" href="/settings" color="bg-secondary/10 text-secondary" />
                    <FeatureCard icon={Globe} title="Manage Sites" description="Connect WordPress instances" href="/sites" color="bg-tertiary/10 text-tertiary" />
                    <FeatureCard icon={Zap} title="New Campaign" description="Set up automated drip publishing" href="/campaigns/new" color="bg-amber-500/10 text-amber-400" />
                    <FeatureCard icon={Layers} title="New Pillar Article" description="Create a long-form comprehensive guide" href="/pillar/new" color="bg-violet-500/10 text-violet-400" />
                    <FeatureCard icon={BarChart2} title="View Analytics" description="Token usage and cost breakdown" href="/analytics" color="bg-violet-500/10 text-violet-400" />
                </div>
            </div>
        </div>
    )
}
