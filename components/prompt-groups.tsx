'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, Copy, Check, Save, ChevronDown, Loader2 } from 'lucide-react'
import { updatePromptGroups } from '@/app/actions/settings'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export type PromptGroup = {
    id: string
    name: string
    isDefault?: boolean
    // Article
    articlePrompt: string
    // Images
    featureImagePrompt: string
    inlineImagePrompt: string
    // Social
    pinterestPrompt: string
}

const DEFAULT_GROUP: PromptGroup = {
    id: 'default',
    name: 'Default',
    isDefault: true,
    articlePrompt: `You are an expert SEO recipe writer. Write a comprehensive English article about {title} using these ingredients: {ingredients} and these directions: {directions}. Minimum 2000 words.

=== STRUCTURE (this exact order) ===
1. Engaging intro (why this recipe is special)
2. Ingredients overview
3. Step-by-step instructions
4. Expert tips and variations
5. Storage & serving suggestions
6. FAQs
7. Conclusion with CTA`,
    featureImagePrompt:
        'Professional food photography of {title}, beautifully presented on white cloth, clear glass of water beside it, natural lighting, clean table, appetizing composition, Instagram-worthy',
    inlineImagePrompt:
        'Overhead shot of {title} ingredients neatly arranged on clean white surface, natural lighting, organized prep scene, high resolution food photography',
    pinterestPrompt:
        'Create a Pinterest pin for {title}. Include a compelling headline and 3 key benefits. Make it engaging and shareable.',
}

type Props = {
    initialGroups?: PromptGroup[]
    initialActiveGroup?: string
}

export function PromptGroupsManager({ initialGroups, initialActiveGroup }: Props) {
    const [groups, setGroups] = useState<PromptGroup[]>(
        initialGroups && initialGroups.length > 0 ? initialGroups : [DEFAULT_GROUP]
    )
    const [activeGroupId, setActiveGroupId] = useState(initialActiveGroup || groups[0]?.id || 'default')
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [newGroupName, setNewGroupName] = useState('')
    const [showNewGroup, setShowNewGroup] = useState(false)

    const activeGroup = groups.find((g) => g.id === activeGroupId) || groups[0]

    const updateField = (field: keyof PromptGroup, value: string) => {
        setGroups((prev) =>
            prev.map((g) => (g.id === activeGroupId ? { ...g, [field]: value } : g))
        )
        setSaved(false)
    }

    const addGroup = () => {
        if (!newGroupName.trim()) return
        const id = `group_${Date.now()}`
        const newGroup: PromptGroup = {
            ...DEFAULT_GROUP,
            id,
            name: newGroupName.trim(),
            isDefault: false,
        }
        setGroups((prev) => [...prev, newGroup])
        setActiveGroupId(id)
        setNewGroupName('')
        setShowNewGroup(false)
    }

    const duplicateGroup = (groupId: string) => {
        const source = groups.find((g) => g.id === groupId)
        if (!source) return
        const id = `group_${Date.now()}`
        const copy: PromptGroup = { ...source, id, name: `${source.name} (copy)`, isDefault: false }
        setGroups((prev) => [...prev, copy])
        setActiveGroupId(id)
    }

    const deleteGroup = (groupId: string) => {
        if (groups.length <= 1) return
        const updated = groups.filter((g) => g.id !== groupId)
        setGroups(updated)
        setActiveGroupId(updated[0].id)
    }

    const handleSave = async () => {
        setSaving(true)
        const payload = JSON.stringify({ groups, activeGroup: activeGroupId })
        await updatePromptGroups(payload)
        setSaving(false)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
    }

    const PROMPTS: { key: keyof PromptGroup; label: string; description: string; rows: number }[] = [
        {
            key: 'articlePrompt',
            label: 'Article Generation Prompt',
            description: 'Variables: {title}, {keyword}, {ingredients}, {directions}',
            rows: 8,
        },
        {
            key: 'featureImagePrompt',
            label: 'Feature Image Prompt',
            description: 'Variables: {title}, {keyword} — sent to your image provider',
            rows: 3,
        },
        {
            key: 'inlineImagePrompt',
            label: 'Inline Image Prompt',
            description: 'Variables: {title}, {ingredients}',
            rows: 3,
        },
        {
            key: 'pinterestPrompt',
            label: 'Pinterest Pin Prompt',
            description: 'Variables: {title}, {keyword}',
            rows: 3,
        },
    ]

    return (
        <div className="space-y-6">
            {/* Group selector row */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="flex-1 flex items-center gap-4 flex-wrap min-w-[200px]">
                    <Select value={activeGroupId} onValueChange={setActiveGroupId}>
                        <SelectTrigger className="w-[240px] h-11 bg-background">
                            <SelectValue placeholder="Select a prompt group" />
                        </SelectTrigger>
                        <SelectContent>
                            {groups.map((g) => (
                                <SelectItem key={g.id} value={g.id} className="font-medium">
                                    {g.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => duplicateGroup(activeGroupId)}
                        className="gap-1.5 text-xs"
                    >
                        <Copy className="h-3 w-3" /> Duplicate
                    </Button>
                    {!activeGroup?.isDefault && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => deleteGroup(activeGroupId)}
                            className="gap-1.5 text-xs text-red-400 hover:text-red-400"
                        >
                            <Trash2 className="h-3 w-3" /> Delete
                        </Button>
                    )}
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowNewGroup(!showNewGroup)}
                        className="gap-1.5 text-xs"
                    >
                        <Plus className="h-3 w-3" /> New Group
                    </Button>
                </div>
            </div>

            {/* New group input */}
            <AnimatePresence>
                {showNewGroup && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-surface-container-high/30 border border-outline-variant/10 shadow-sm mt-4">
                            <Input
                                value={newGroupName}
                                onChange={(e) => setNewGroupName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addGroup()}
                                placeholder="Group Name (e.g. Travel Blog)"
                                className="bg-surface-container-high border-outline-variant/10 h-10 rounded-xl flex-1 text-sm font-bold"
                            />
                            <Button type="button" onClick={addGroup} className="h-10 rounded-xl bg-secondary text-on-secondary font-bold text-xs uppercase tracking-widest px-6 shadow-md shadow-secondary/20">Create</Button>
                            <Button type="button" variant="ghost" onClick={() => setShowNewGroup(false)} className="h-10 rounded-xl text-xs font-bold uppercase tracking-widest text-foreground/40 hover:text-foreground/80">Cancel</Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Default group notice */}
            {activeGroup?.isDefault && (
                <div className="text-xs text-muted-foreground bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
                    💡 The <strong>Default</strong> group is editable. <strong>Duplicate</strong> it to create a custom group and keep the original as a backup.
                </div>
            )}

            {/* Prompts editor */}
            {activeGroup && (
                <div className="space-y-5">
                    {PROMPTS.map(({ key, label, description, rows }) => (
                        <div key={key} className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium">{label}</Label>
                                <span className="text-xs text-muted-foreground font-mono">{description}</span>
                            </div>
                            <textarea
                                value={(activeGroup as any)[key] || ''}
                                onChange={(e) => updateField(key, e.target.value)}
                                rows={rows}
                                className="w-full bg-surface-container-high/50 border border-outline-variant/10 rounded-2xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 resize-y transition-all"
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Sticky Save Footer */}
            <div className="sticky bottom-4 z-20 mx-auto max-w-lg mt-8">
                <div className="bg-surface-container-high/60 backdrop-blur-3xl border border-outline-variant/10 p-3 rounded-full flex items-center justify-between shadow-2xl">
                    <div className="flex items-center gap-3 px-4">
                        <div className={`w-2 h-2 rounded-full ${saving ? 'bg-secondary animate-pulse' : 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]'}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-foreground/60">
                            {saving ? "Saving Prompts..." : saved ? "Logic Updated" : "Awaiting Sync"}
                        </span>
                    </div>
                    <Button type="button" onClick={handleSave} disabled={saving} size="lg" className="h-12 px-8 rounded-full bg-secondary text-on-secondary font-black text-xs uppercase tracking-[0.15em] transition-all hover:scale-105 active:scale-95 shadow-xl shadow-secondary/20 gap-3">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                        Commit Logic
                    </Button>
                </div>
            </div>
        </div>
    )
}
