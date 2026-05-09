'use client'

import { useState, useTransition, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select, SelectContent, SelectGroup, SelectItem,
    SelectLabel, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { updateSettings } from "@/app/actions/settings"
import { validateOpenRouterKey } from "@/app/actions/validate-keys"
import { fetchOpenRouterModels, type OpenRouterModel } from "@/app/actions/openrouter-models"
import { 
    Loader2, RefreshCw, CheckCircle2, XCircle, Search, 
    Zap, Save, Globe, Plus, ExternalLink, Key, 
    MessageSquare, Settings as SettingsIcon, ShieldCheck,
    Cpu, Image as ImageIcon, UserCircle
} from "lucide-react"
import { PromptGroupsManager, type PromptGroup } from "@/components/prompt-groups"

interface SettingsFormProps {
    initialSettings: {
        openaiKey?: string | null
        openRouterKey?: string | null
        aiModel?: string
        goapiKey?: string | null
        ttapiKey?: string | null
        linkrApiKey?: string | null
        imageProvider?: string
        wpUrl?: string | null
        wpUser?: string | null
        wpAppPass?: string | null
        authorBio?: string | null
        expertPersona?: string | null
        promptGroups?: string | null
        nativeMjToken?: string | null
        nativeMjServerId?: string | null
        nativeMjChannelId?: string | null
        nativeMjBannedKeywords?: string | null
    } | null
}

function groupModelsByProvider(models: OpenRouterModel[]): Record<string, OpenRouterModel[]> {
    const groups: Record<string, OpenRouterModel[]> = {}
    for (const model of models) {
        const provider = model.id.split('/')[0] || 'other'
        if (!groups[provider]) groups[provider] = []
        groups[provider].push(model)
    }
    return groups
}

function providerLabel(provider: string): string {
    const labels: Record<string, string> = {
        openai: '🤖 OpenAI', anthropic: '🧠 Anthropic', google: '✨ Google',
        meta: '🦙 Meta (Llama)', 'meta-llama': '🦙 Meta (Llama)', mistralai: '💫 Mistral AI',
        deepseek: '🔍 DeepSeek', microsoft: '🪟 Microsoft', cohere: '🌀 Cohere',
        qwen: '🐉 Qwen (Alibaba)', 'x-ai': '𝕏 xAI (Grok)', perplexity: '🔭 Perplexity',
        nvidia: '⚡ NVIDIA', '01-ai': '01 AI',
    }
    return labels[provider] || `🔷 ${provider.charAt(0).toUpperCase() + provider.slice(1)}`
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
    const [isPending, startTransition] = useTransition()
    const [saved, setSaved] = useState(false)
    const [activeTab, setActiveTab] = useState('api-keys')

    // OpenRouter key + validation
    const [openRouterKey, setOpenRouterKey] = useState(initialSettings?.openRouterKey || '')
    const [validating, setValidating] = useState(false)
    const [validationResult, setValidationResult] = useState<{ valid: boolean; message?: string; error?: string } | null>(null)

    // LinkrAPI
    const [linkrApiKey, setLinkrApiKey] = useState(initialSettings?.linkrApiKey || '')
    const [linkrValidating, setLinkrValidating] = useState(false)
    const [linkrValidationResult, setLinkrValidationResult] = useState<{ valid: boolean; message?: string; error?: string } | null>(null)
    const [linkrTestPrompt, setLinkrTestPrompt] = useState('A cute cat in space')
    const [linkrTestGenerating, setLinkrTestGenerating] = useState(false)
    const [linkrTestResultUrl, setLinkrTestResultUrl] = useState<string | null>(null)
    const [linkrTestError, setLinkrTestError] = useState<string | null>(null)

    // Image provider + all keys in state
    const [imageProvider, setImageProvider] = useState(initialSettings?.imageProvider || 'goapi')
    const [goapiKey, setGoapiKey] = useState(initialSettings?.goapiKey || '')
    const [ttapiKey, setTtapiKey] = useState(initialSettings?.ttapiKey || '')

    // NativeMJ (Discord)
    const [nativeMjToken, setNativeMjToken] = useState(initialSettings?.nativeMjToken || '')
    const [nativeMjServerId, setNativeMjServerId] = useState(initialSettings?.nativeMjServerId || '')
    const [nativeMjChannelId, setNativeMjChannelId] = useState(initialSettings?.nativeMjChannelId || '')
    const [nativeMjBannedKeywords, setNativeMjBannedKeywords] = useState(initialSettings?.nativeMjBannedKeywords || '')

    // Models
    const [models, setModels] = useState<OpenRouterModel[]>([])
    const [loadingModels, setLoadingModels] = useState(false)
    const [modelsError, setModelsError] = useState<string | null>(null)
    const [modelsLoaded, setModelsLoaded] = useState(false)
    const [selectedModel, setSelectedModel] = useState(initialSettings?.aiModel || 'openai/gpt-4o')
    const [modelSearch, setModelSearch] = useState('')
    const searchRef = useRef<HTMLInputElement>(null)

    // Prompt groups
    const parsedPromptGroups = (() => {
        if (!initialSettings?.promptGroups) return { groups: [], activeGroup: '' }
        try { return JSON.parse(initialSettings.promptGroups) } catch { return { groups: [], activeGroup: '' } }
    })()

    const loadModels = useCallback(async (key: string) => {
        if (!key?.trim()) return
        setLoadingModels(true); setModelsError(null)
        try {
            const result = await fetchOpenRouterModels(key)
            if (result.success && result.models) {
                setModels(result.models); setModelsLoaded(true)
            } else {
                setModelsError(result.error || 'Failed to load models'); setModels([]); setModelsLoaded(false)
            }
        } catch (e: any) { setModelsError(e.message) }
        finally { setLoadingModels(false) }
    }, [])

    useEffect(() => {
        if (initialSettings?.openRouterKey) loadModels(initialSettings.openRouterKey)
    }, [initialSettings?.openRouterKey, loadModels])

    function handleKeyBlur() {
        const trimmed = openRouterKey.trim()
        if (trimmed && trimmed !== initialSettings?.openRouterKey && trimmed.length > 20) loadModels(trimmed)
    }

    async function handleTestConnection() {
        if (!openRouterKey.trim()) return
        setValidating(true); setValidationResult(null)
        const response = await validateOpenRouterKey(openRouterKey)
        setValidationResult(response); setValidating(false)
        if (response.valid) loadModels(openRouterKey)
    }

    async function handleSubmit(formData: FormData) {
        formData.set('aiModel', selectedModel)
        formData.set('imageProvider', imageProvider)
        formData.set('goapiKey', goapiKey)
        formData.set('ttapiKey', ttapiKey)
        formData.set('linkrApiKey', linkrApiKey)
        formData.set('nativeMjToken', nativeMjToken)
        formData.set('nativeMjServerId', nativeMjServerId)
        formData.set('nativeMjChannelId', nativeMjChannelId)
        formData.set('nativeMjBannedKeywords', nativeMjBannedKeywords)
        startTransition(async () => {
            await updateSettings(formData)
            setSaved(true)
            setTimeout(() => setSaved(false), 2000)
        })
    }

    const filteredModels = modelSearch.trim()
        ? models.filter(m => m.id.toLowerCase().includes(modelSearch.toLowerCase()) || (m.name || '').toLowerCase().includes(modelSearch.toLowerCase()))
        : models
    const groupedModels = groupModelsByProvider(filteredModels)
    const providerNames = Object.keys(groupedModels).sort()

    return (
        <div className="w-full mx-auto space-y-8">
            {/* Page Header */}
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-black tracking-tight text-foreground font-display uppercase italic">
                    Engine <span className="text-secondary">Configuration</span>
                </h1>
                <p className="text-foreground/40 font-medium text-sm">Fine-tune your content generation pipeline and connect your neural endpoints.</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 items-start">
                {/* Sidebar Navigation */}
                <div className="w-full lg:w-72 shrink-0 space-y-3 sticky top-8">
                    {[
                        { id: 'api-keys', label: 'Endpoints', icon: Key, desc: 'Neural connectivity' },
                        { id: 'prompts', label: 'Logic', icon: MessageSquare, desc: 'Prompt engineering' },
                        { id: 'web-sites', label: 'Publishing', icon: Globe, desc: 'Output nodes' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-4 px-5 py-4 rounded-3xl transition-all text-left group border ${
                                activeTab === tab.id 
                                ? 'bg-secondary text-on-secondary border-secondary/20 shadow-xl shadow-secondary/20 scale-[1.02]' 
                                : 'bg-surface-container-low border-outline-variant/5 hover:border-secondary/30 hover:bg-surface-container-high'
                            }`}
                        >
                            <div className={`p-2.5 rounded-2xl transition-colors ${activeTab === tab.id ? 'bg-on-secondary/10' : 'bg-secondary/10 text-secondary group-hover:bg-secondary/20 group-hover:scale-110'}`}>
                                <tab.icon className="h-5 w-5" />
                            </div>
                            <div>
                                <div className="font-black text-sm uppercase tracking-widest">{tab.label}</div>
                                <div className={`text-[10px] font-medium mt-0.5 ${activeTab === tab.id ? 'text-on-secondary/70' : 'text-foreground/40'}`}>{tab.desc}</div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Main Content Area */}
                <div className="flex-1 w-full min-w-0">
                    <AnimatePresence mode="wait">
                        {activeTab === 'api-keys' && (
                            <motion.div
                                key="api-keys"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                    <form action={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            {/* Left Column: AI & Core */}
                            <div className="lg:col-span-12 space-y-6">
                                <section className="p-8 rounded-[2rem] bg-surface-container-low border border-outline-variant/5 shadow-xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                                        <Cpu className="h-32 w-32" />
                                    </div>
                                    
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                            <Zap className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-lg uppercase tracking-tight font-display">Neural Engine</h3>
                                            <p className="text-xs text-foreground/40 font-medium">Configure OpenRouter connectivity and model selection.</p>
                                        </div>
                                    </div>

                                    <div className="grid gap-8">
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/60 ml-1">OpenRouter Access Key</Label>
                                            <div className="relative group">
                                                <Input
                                                    id="openRouterKey"
                                                    name="openRouterKey"
                                                    type="password"
                                                    value={openRouterKey}
                                                    onChange={(e) => { setOpenRouterKey(e.target.value); setValidationResult(null) }}
                                                    onBlur={handleKeyBlur}
                                                    placeholder="sk-or-v1-..."
                                                    className="h-14 bg-surface-container-high border-outline-variant/10 rounded-2xl px-6 font-mono text-sm focus:ring-secondary/20 focus:border-secondary/30 transition-all"
                                                />
                                                <div className="absolute right-2 top-2">
                                                    <Button 
                                                        type="button" 
                                                        variant="secondary" 
                                                        size="sm" 
                                                        onClick={handleTestConnection} 
                                                        disabled={validating || !openRouterKey}
                                                        className="h-10 rounded-xl px-4 text-[10px] font-black uppercase tracking-wider gap-2 shadow-lg shadow-secondary/10"
                                                    >
                                                        {validating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                                                        Test Sync
                                                    </Button>
                                                </div>
                                            </div>
                                            
                                            <AnimatePresence>
                                                {validationResult && (
                                                    <motion.p 
                                                        initial={{ opacity: 0, y: -10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 px-4 py-2 rounded-lg border ${
                                                            validationResult.valid 
                                                            ? 'text-green-400 bg-green-400/5 border-green-400/20 shadow-[0_0_15px_-5px_rgba(74,222,128,0.3)]' 
                                                            : 'text-red-400 bg-red-400/5 border-red-400/20'
                                                        }`}
                                                    >
                                                        {validationResult.valid ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                                                        {validationResult.valid ? "Sync established" : validationResult.error}
                                                    </motion.p>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-outline-variant/5">
                                            <div className="space-y-3">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/60 ml-1">AI Architecture</Label>
                                                {loadingModels ? (
                                                    <div className="h-14 rounded-2xl bg-surface-container-high flex items-center gap-3 px-6 text-sm text-foreground/30 animate-pulse border border-outline-variant/5">
                                                        <Loader2 className="h-4 w-4 animate-spin text-secondary" /> Decoding Models...
                                                    </div>
                                                ) : models.length > 0 ? (
                                                    <div className="space-y-4">
                                                        <div className="relative group/search">
                                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/20 group-focus-within/search:text-secondary transition-colors" />
                                                            <input 
                                                                ref={searchRef} 
                                                                type="text" 
                                                                placeholder="Search models..."
                                                                value={modelSearch} 
                                                                onChange={(e) => setModelSearch(e.target.value)}
                                                                className="w-full h-12 pl-12 pr-4 bg-surface-container-high border border-outline-variant/10 rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-secondary/30 transition-all font-bold placeholder:font-medium" 
                                                            />
                                                        </div>
                                                        <Select name="aiModel" value={selectedModel} onValueChange={setSelectedModel}>
                                                            <SelectTrigger className="h-14 bg-surface-container-high border-outline-variant/10 rounded-2xl px-6 font-bold text-sm shadow-sm">
                                                                <SelectValue placeholder="Select Neural Model" />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-surface-container-low border-outline-variant/20 rounded-2xl shadow-2xl max-h-[400px]">
                                                                {providerNames.map((provider) => (
                                                                    <SelectGroup key={provider}>
                                                                        <SelectLabel className="text-[10px] font-black uppercase tracking-widest text-secondary/60 px-4 py-2">{providerLabel(provider)}</SelectLabel>
                                                                        {groupedModels[provider].map((model) => (
                                                                            <SelectItem key={model.id} value={model.id} className="rounded-xl mx-1 my-0.5 hover:bg-surface-container-high transition-colors">
                                                                                <span className="font-bold">{model.name || model.id}</span>
                                                                                {model.context_length && <span className="ml-2 text-[10px] opacity-40 font-medium">{(model.context_length / 1000).toFixed(0)}K Tokens</span>}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectGroup>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                ) : (
                                                    <FallbackModelSelect value={selectedModel} onChange={setSelectedModel} />
                                                )}
                                                <div className="flex items-center gap-2 px-4 py-2 border border-outline-variant/5 bg-background/40 rounded-xl">
                                                    <span className="text-[9px] font-black text-secondary uppercase tracking-widest">Active:</span>
                                                    <code className="text-[10px] font-bold text-foreground/40 truncate">{selectedModel}</code>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/60 ml-1">Legacy Node <span className="text-[8px] opacity-40 italic ml-1">(Backup Only)</span></Label>
                                                <Input 
                                                    id="openaiKey" 
                                                    name="openaiKey" 
                                                    type="password" 
                                                    defaultValue={initialSettings?.openaiKey || ""} 
                                                    placeholder="Standard OpenAI Key" 
                                                    className="h-14 bg-surface-container-high/40 border-outline-variant/10 rounded-2xl px-6 font-mono text-sm opacity-60 focus:opacity-100 transition-opacity" 
                                                />
                                                <p className="text-[9px] text-foreground/30 font-medium italic ml-1">Used automatically if neural sync fails.</p>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Image Generation */}
                                    <section className="p-8 rounded-[2rem] bg-surface-container-low border border-outline-variant/5 shadow-lg group relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                                            <ImageIcon className="h-24 w-24" />
                                        </div>
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-9 h-9 rounded-xl bg-tertiary/10 flex items-center justify-center text-tertiary">
                                                <ImageIcon className="h-4.5 w-4.5" />
                                            </div>
                                            <h3 className="font-black text-base uppercase tracking-tight font-display">Visualization</h3>
                                        </div>

                                        <div className="space-y-6">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/60 ml-1">Imaging Providers</Label>

                                            <div className="grid gap-4">
                                                {/* GoAPI */}
                                                <div className={`p-5 rounded-3xl border transition-all ${imageProvider === 'goapi' ? 'border-primary bg-primary/5' : 'border-outline-variant/10 bg-surface-container-high/30'}`}>
                                                    <label className="flex items-center gap-3 cursor-pointer mb-4">
                                                        <input type="radio" name="imageProvider" value="goapi" checked={imageProvider === 'goapi'} onChange={() => setImageProvider('goapi')} className="w-4 h-4 accent-primary" />
                                                        <span className="font-black text-sm uppercase tracking-tight">🖼️ GoAPI Midjourney</span>
                                                        {imageProvider === 'goapi' && <span className="ml-auto text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase">Active</span>}
                                                    </label>
                                                    <div className="space-y-2 pl-7">
                                                        <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/60 ml-1">GoAPI Interface Token</Label>
                                                        <Input name="goapiKey" type="password" value={goapiKey} onChange={(e) => setGoapiKey(e.target.value)} placeholder="Authorization Key" className="h-11 bg-surface-container-high border-outline-variant/10 rounded-xl px-4 font-mono text-xs" />
                                                    </div>
                                                </div>

                                                {/* TTAPI */}
                                                <div className={`p-5 rounded-3xl border transition-all ${imageProvider === 'ttapi' ? 'border-primary bg-primary/5' : 'border-outline-variant/10 bg-surface-container-high/30'}`}>
                                                    <label className="flex items-center gap-3 cursor-pointer mb-4">
                                                        <input type="radio" name="imageProvider" value="ttapi" checked={imageProvider === 'ttapi'} onChange={() => setImageProvider('ttapi')} className="w-4 h-4 accent-primary" />
                                                        <span className="font-black text-sm uppercase tracking-tight">⚡ TTAPI Hold Mode</span>
                                                        {imageProvider === 'ttapi' && <span className="ml-auto text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase">Active</span>}
                                                    </label>
                                                    <div className="space-y-2 pl-7">
                                                        <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/60 ml-1">TTAPI Node Token</Label>
                                                        <Input name="ttapiKey" type="password" value={ttapiKey} onChange={(e) => setTtapiKey(e.target.value)} placeholder="Authorization Key" className="h-11 bg-surface-container-high border-outline-variant/10 rounded-xl px-4 font-mono text-xs" />
                                                    </div>
                                                </div>

                                                {/* LinkrAPI */}
                                                <div className={`p-5 rounded-3xl border transition-all ${imageProvider === 'linkrapi' ? 'border-primary bg-primary/5' : 'border-outline-variant/10 bg-surface-container-high/30'}`}>
                                                    <label className="flex items-center gap-3 cursor-pointer mb-4">
                                                        <input type="radio" name="imageProvider" value="linkrapi" checked={imageProvider === 'linkrapi'} onChange={() => setImageProvider('linkrapi')} className="w-4 h-4 accent-primary" />
                                                        <span className="font-black text-sm uppercase tracking-tight">🔗 LinkrAPI Proxy</span>
                                                        <div className="ml-auto flex items-center gap-2">
                                                            {imageProvider === 'linkrapi' && <span className="text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase">Active</span>}
                                                            <a href="https://linkrapi.com/docs" target="_blank" className="text-[9px] font-bold text-foreground/40 hover:text-primary flex items-center gap-1">DOCS <ExternalLink size={10} /></a>
                                                        </div>
                                                    </label>
                                                    <div className="space-y-3 pl-7">
                                                        <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/60 ml-1">LinkrAPI Connectivity Key</Label>
                                                        <Input id="linkrApiKey" name="linkrApiKey" type="password" value={linkrApiKey} onChange={(e) => { setLinkrApiKey(e.target.value); setLinkrValidationResult(null) }} placeholder="lkr_..." className="h-11 bg-surface-container-high border-outline-variant/10 rounded-xl px-4 font-mono text-xs" />
                                                        
                                                        <Button type="button" variant="outline" size="sm" disabled={linkrValidating || !linkrApiKey} onClick={async () => {
                                                            setLinkrValidating(true); setLinkrValidationResult(null)
                                                            const { validateLinkrApiKey } = await import('@/lib/linkrapi')
                                                            const res = await validateLinkrApiKey(linkrApiKey)
                                                            setLinkrValidationResult(res); setLinkrValidating(false)
                                                        }} className="w-full h-9 rounded-xl border-primary/20 text-primary font-black text-[9px] uppercase tracking-widest">
                                                            {linkrValidating ? <Loader2 size={12} className="animate-spin" /> : "Verify LinkrNode"}
                                                        </Button>
                                                        
                                                        {linkrValidationResult && (
                                                            <div className={`mt-2 p-2.5 rounded-xl text-[10px] font-bold text-center animate-in fade-in duration-200 ${linkrValidationResult.valid ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                                                {linkrValidationResult.valid ? linkrValidationResult.message : `Error: ${linkrValidationResult.error}`}
                                                            </div>
                                                        )}
                                                        
                                                        {linkrValidationResult?.valid && (
                                                            <div className="mt-4 pt-4 border-t border-primary/10 animate-in fade-in duration-300">
                                                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary/80 ml-1 mb-2 block">Test Generation</Label>
                                                                <div className="flex gap-2">
                                                                    <Input 
                                                                        value={linkrTestPrompt} 
                                                                        onChange={(e) => setLinkrTestPrompt(e.target.value)} 
                                                                        placeholder="Enter prompt (e.g., A cute cat)" 
                                                                        className="h-9 flex-1 bg-surface-container-highest border-primary/20 text-xs rounded-xl"
                                                                    />
                                                                    <Button 
                                                                        type="button" 
                                                                        onClick={async () => {
                                                                            if (!linkrApiKey || !linkrTestPrompt) return;
                                                                            setLinkrTestGenerating(true);
                                                                            setLinkrTestError(null);
                                                                            setLinkrTestResultUrl(null);
                                                                            try {
                                                                                const { linkrWaitForResult } = await import('@/lib/linkrapi');
                                                                                const url = await linkrWaitForResult(linkrTestPrompt, linkrApiKey, 300, 8000);
                                                                                setLinkrTestResultUrl(url);
                                                                            } catch (err: any) {
                                                                                setLinkrTestError(err.message || 'Generation failed');
                                                                            } finally {
                                                                                setLinkrTestGenerating(false);
                                                                            }
                                                                        }}
                                                                        disabled={linkrTestGenerating || !linkrTestPrompt}
                                                                        className="h-9 px-4 bg-primary hover:bg-primary/90 text-white rounded-xl text-[10px] font-bold transition-all shadow-md shadow-primary/20"
                                                                    >
                                                                        {linkrTestGenerating ? <Loader2 size={12} className="animate-spin" /> : "Test Prompt"}
                                                                    </Button>
                                                                </div>
                                                                
                                                                {linkrTestError && (
                                                                    <div className="mt-2 text-[10px] text-red-500 font-medium p-2 bg-red-500/10 rounded-xl">Error: {linkrTestError}</div>
                                                                )}
                                                                
                                                                {linkrTestResultUrl && (
                                                                    <div className="mt-3 p-2 bg-surface-container-highest rounded-xl border border-primary/20 overflow-hidden relative group">
                                                                        <p className="text-[9px] font-bold text-primary uppercase tracking-widest mb-2 text-center">Generation Result</p>
                                                                        <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-black/10">
                                                                            <img src={linkrTestResultUrl} alt="Test Result" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                                                        </div>
                                                                        <a href={linkrTestResultUrl} target="_blank" className="absolute top-8 right-2 p-1.5 bg-black/50 hover:bg-black/80 text-white rounded-lg backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">
                                                                            <ExternalLink size={14} />
                                                                        </a>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* NativeMJ */}
                                                <div className={`p-5 rounded-3xl border transition-all ${imageProvider === 'nativemj' ? 'border-tertiary bg-tertiary/5' : 'border-outline-variant/10 bg-surface-container-high/30'}`}>
                                                    <label className="flex items-center gap-3 cursor-pointer mb-4">
                                                        <input type="radio" name="imageProvider" value="nativemj" checked={imageProvider === 'nativemj'} onChange={() => setImageProvider('nativemj')} className="w-4 h-4 accent-tertiary" />
                                                        <span className="font-black text-sm uppercase tracking-tight">🎮 NativeMJ (Discord Bot)</span>
                                                        <div className="ml-auto flex items-center gap-2">
                                                            {imageProvider === 'nativemj' && <span className="text-[9px] font-bold text-tertiary bg-tertiary/10 px-2 py-0.5 rounded-full uppercase">Active</span>}
                                                        </div>
                                                    </label>
                                                    <div className="space-y-4 pl-7">
                                                        <div className="space-y-2">
                                                            <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/60 ml-1">Discord User Token</Label>
                                                            <Input name="nativeMjToken" type="password" value={nativeMjToken} onChange={(e) => setNativeMjToken(e.target.value)} placeholder="MTEy..." className="h-11 bg-surface-container-high border-outline-variant/10 rounded-xl px-4 font-mono text-xs" />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div className="space-y-2">
                                                                <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/60 ml-1">Server ID</Label>
                                                                <Input name="nativeMjServerId" value={nativeMjServerId} onChange={(e) => setNativeMjServerId(e.target.value)} placeholder="123456789..." className="h-11 bg-surface-container-high border-outline-variant/10 rounded-xl px-4 font-mono text-xs" />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/60 ml-1">Channel ID</Label>
                                                                <Input name="nativeMjChannelId" value={nativeMjChannelId} onChange={(e) => setNativeMjChannelId(e.target.value)} placeholder="987654321..." className="h-11 bg-surface-container-high border-outline-variant/10 rounded-xl px-4 font-mono text-xs" />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/60 ml-1">Banned Keywords (Comma separated)</Label>
                                                            <Input name="nativeMjBannedKeywords" value={nativeMjBannedKeywords} onChange={(e) => setNativeMjBannedKeywords(e.target.value)} placeholder="ugly, deformed, bad anatomy..." className="h-11 bg-surface-container-high border-outline-variant/10 rounded-xl px-4 font-mono text-xs" />
                                                        </div>
                                                        <div className="pt-2">
                                                            <a href="/nativemj" target="_blank" className="inline-flex items-center justify-center gap-2 h-9 px-4 bg-tertiary hover:bg-tertiary/90 text-white rounded-xl text-[10px] font-bold transition-all shadow-md shadow-tertiary/20">
                                                                Open NativeMJ Queue Dashboard <ExternalLink size={12} />
                                                            </a>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    {/* Personality Layer */}
                                    <section className="p-8 rounded-[2rem] bg-surface-container-low border border-outline-variant/5 shadow-lg relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                                            <UserCircle className="h-24 w-24" />
                                        </div>
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                                <UserCircle className="h-4.5 w-4.5" />
                                            </div>
                                            <h3 className="font-black text-base uppercase tracking-tight font-display">Personality</h3>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/60 ml-1">Author Algorithm</Label>
                                                <textarea id="authorBio" name="authorBio" rows={2} defaultValue={initialSettings?.authorBio || ""} placeholder="The human element..." className="w-full bg-surface-container-high border-outline-variant/10 rounded-2xl p-4 text-xs font-medium focus:ring-1 focus:ring-primary/20 transition-all resize-none" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/60 ml-1">Expert Persona</Label>
                                                <textarea id="expertPersona" name="expertPersona" rows={2} defaultValue={initialSettings?.expertPersona || ""} placeholder="The scientific perspective..." className="w-full bg-surface-container-high border-outline-variant/10 rounded-2xl p-4 text-xs font-medium focus:ring-1 focus:ring-primary/20 transition-all resize-none" />
                                            </div>
                                        </div>
                                    </section>
                                </div>
                            </div>
                        </div>

                        {/* Sticky Action Footer */}
                        <div className="sticky bottom-4 z-20 mx-auto max-w-lg">
                            <div className="bg-surface-container-high/60 backdrop-blur-3xl border border-outline-variant/10 p-3 rounded-full flex items-center justify-between shadow-2xl">
                                <div className="flex items-center gap-3 px-4">
                                    <div className={`w-2 h-2 rounded-full ${isPending ? 'bg-secondary animate-pulse' : 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]'}`} />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-foreground/60">
                                        {isPending ? "Configuring..." : saved ? "Logic Updated" : "Operational"}
                                    </span>
                                </div>
                                <Button type="submit" size="lg" disabled={isPending} className="h-12 px-8 rounded-full bg-secondary text-on-secondary font-black text-xs uppercase tracking-[0.15em] transition-all hover:scale-105 active:scale-95 shadow-xl shadow-secondary/20 gap-3">
                                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                                    Commit Sync
                                </Button>
                            </div>
                        </div>
                    </form>
                            </motion.div>
                        )}

                        {activeTab === 'prompts' && (
                            <motion.div
                                key="prompts"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="p-8 rounded-[2.5rem] bg-surface-container-low border border-outline-variant/5 shadow-xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                                        <MessageSquare className="h-32 w-32" />
                                    </div>
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary">
                                            <MessageSquare className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black uppercase tracking-tight font-display leading-tight italic">Logical <span className="text-secondary">Templates</span></h3>
                                            <p className="text-xs text-foreground/40 font-medium">Engineer the high-level instructions defining your content output.</p>
                                        </div>
                                    </div>
                                    <div className="bg-background/40 backdrop-blur-sm rounded-3xl p-6 border border-outline-variant/5">
                                        <PromptGroupsManager
                                            initialGroups={parsedPromptGroups.groups}
                                            initialActiveGroup={parsedPromptGroups.activeGroup}
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'web-sites' && (
                            <motion.div
                                key="web-sites"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="p-8 rounded-[2.5rem] bg-surface-container-low border border-outline-variant/5 shadow-xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                                        <Globe className="h-32 w-32" />
                                    </div>
                                    <WebSitesTab />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    )
}

// ─── Web Sites Tab ───────────────────────────────────────────────────────────
function WebSitesTab() {
    const [sites, setSites] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/sites').then(r => r.json()).then(data => {
            setSites(data.sites || [])
            setLoading(false)
        }).catch(() => setLoading(false))
    }, [])

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-tertiary/10 flex items-center justify-center text-tertiary border border-tertiary/20">
                        <Globe className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black uppercase tracking-tight font-display italic">Neural <span className="text-tertiary">Output</span></h3>
                        <p className="text-xs text-foreground/40 font-medium mt-0.5">Connected WordPress instances awaiting fulfillment.</p>
                    </div>
                </div>
                <Link href="/sites/new">
                    <Button size="lg" className="h-12 px-6 rounded-2xl bg-tertiary text-on-tertiary font-black text-xs uppercase tracking-widest gap-3 shadow-xl shadow-tertiary/20 hover:scale-[1.02] active:scale-95 transition-all">
                        <Plus className="h-4.5 w-4.5 font-black" />
                        Connect Node
                    </Button>
                </Link>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-foreground/20 animate-pulse">
                    <Loader2 className="h-12 w-12 animate-spin mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Interrogating Database...</p>
                </div>
            ) : sites.length === 0 ? (
                <div className="rounded-3xl border-2 border-dashed border-outline-variant/10 py-20 text-center bg-surface-container-low/50">
                    <div className="w-20 h-20 rounded-full bg-surface-container-high mx-auto flex items-center justify-center mb-6 text-foreground/10">
                        <Globe className="h-10 w-10" />
                    </div>
                    <h4 className="text-lg font-black text-foreground uppercase tracking-tight font-display mb-1">No Output Nodes Detected</h4>
                    <p className="text-xs text-foreground/30 max-w-[280px] mx-auto leading-relaxed">System output is currently unmapped. Connect a WordPress instance to authorize publishing.</p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-3xl border border-outline-variant/10 bg-surface-container-low shadow-sm">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-surface-container-high/50 border-b border-outline-variant/10">
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">Identifier</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">Neural Endpoint</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/5">
                            {sites.map((site: any) => (
                                <tr key={site.id} className="group hover:bg-surface-container-high/30 transition-colors">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center text-foreground group-hover:text-primary transition-colors border border-outline-variant/5">
                                                <SettingsIcon size={14} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-foreground group-hover:text-primary transition-colors">{site.name}</p>
                                                {site.isDefault && <span className="text-[8px] font-black uppercase tracking-tighter text-primary bg-primary/10 px-1.5 py-0.5 rounded-full border border-primary/20 mt-1 inline-block">Primary</span>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <a href={site.wpUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs font-bold text-foreground/40 hover:text-secondary group/link transition-colors">
                                            {site.wpUrl} <ExternalLink className="h-3 w-3 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                                        </a>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-green-400">Synchronized</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

// ─── Fallback static model list ───────────────────────────────────────────────
function FallbackModelSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    return (
        <Select value={value} onValueChange={onChange} name="aiModel">
            <SelectTrigger className="h-14 bg-surface-container-high border-outline-variant/10 rounded-2xl px-6 font-bold text-sm">
                <SelectValue placeholder="Select Neural Architecture" />
            </SelectTrigger>
            <SelectContent className="bg-surface-container-low border-outline-variant/20 rounded-2xl shadow-2xl">
                <SelectGroup>
                    <SelectLabel className="text-[10px] font-black uppercase tracking-widest text-primary/60 px-4 py-2">🤖 OpenAI Core</SelectLabel>
                    <SelectItem value="openai/gpt-4o" className="rounded-xl">GPT-4o (Primary)</SelectItem>
                    <SelectItem value="openai/gpt-4o-mini" className="rounded-xl">GPT-4o Mini</SelectItem>
                    <SelectItem value="openai/o3" className="rounded-xl">O3 Reasoning</SelectItem>
                </SelectGroup>
                <SelectGroup>
                    <SelectLabel className="text-[10px] font-black uppercase tracking-widest text-secondary/60 px-4 py-2">🧠 Anthropic Neural</SelectLabel>
                    <SelectItem value="anthropic/claude-3.5-sonnet" className="rounded-xl">Claude 3.5 Sonnet</SelectItem>
                    <SelectItem value="anthropic/claude-3.7-sonnet" className="rounded-xl">Claude 3.7 Sonnet</SelectItem>
                </SelectGroup>
                <SelectGroup>
                    <SelectLabel className="text-[10px] font-black uppercase tracking-widest text-tertiary/60 px-4 py-2">✨ Google Quantum</SelectLabel>
                    <SelectItem value="google/gemini-2.0-flash" className="rounded-xl">Gemini 2.0 Flash</SelectItem>
                </SelectGroup>
            </SelectContent>
        </Select>
    )
}
