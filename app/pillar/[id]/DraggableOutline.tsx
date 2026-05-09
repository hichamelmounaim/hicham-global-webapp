'use client'

import React, { useState } from 'react'
import DOMPurify from 'isomorphic-dompurify'
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Clock, Edit2, Check, X, RefreshCw, Layers, Copy, ChevronUp, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { updatePillarOutline } from '@/app/actions/generate-pillar'

type OutlineSection = { heading: string; subheadings: string[]; id?: string }

// ─── SORTABLE ITEM ─────────────────────────────────────────────────────────────
function SortableItem({
    section,
    index,
    generated,
    isRegenerating,
    onSave,
    onRemove,
    onRegenerate
}: {
    section: OutlineSection & { id: string }
    index: number
    generated?: { html: string; wordCount: number }
    isRegenerating: boolean
    onSave: (id: string, newHeading: string) => void
    onRemove: (id: string) => void
    onRegenerate: (index: number) => void
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id })
    const [isEditing, setIsEditing] = useState(false)
    const [editValue, setEditValue] = useState(section.heading)
    const [expanded, setExpanded] = useState(false)
    const [copied, setCopied] = useState(false)

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
    }

    const handleSave = () => {
        if (editValue.trim() && editValue !== section.heading) {
            onSave(section.id, editValue)
        }
        setIsEditing(false)
    }

    const copyHtml = async () => {
        await navigator.clipboard.writeText(generated?.html || '')
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
    }

    const isGenerated = !!generated

    return (
        <div ref={setNodeRef} style={style} className={`rounded-xl border transition-all ${isDragging ? 'shadow-2xl border-primary/50' : 'border-border/50 bg-card hover:border-primary/20'} mb-2`}>
            <div className="flex items-center">
            {/* Drag Handle */}
            <div {...attributes} {...listeners} className="p-4 cursor-grab hover:text-primary active:cursor-grabbing text-muted-foreground mr-1">
                <GripVertical className="h-4 w-4" />
            </div>

            <div className="flex-1 min-w-0 pr-4 py-3 flex items-center justify-between gap-4">
                {isEditing ? (
                    <div className="flex-1 flex gap-2 items-center">
                        <Input
                            autoFocus
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setIsEditing(false) }}
                            className="bg-background h-8"
                        />
                        <Button size="icon" variant="ghost" onClick={handleSave} className="h-8 w-8 text-green-400"><Check className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => setIsEditing(false)} className="h-8 w-8 text-red-400"><X className="h-4 w-4" /></Button>
                    </div>
                ) : (
                    <div className="flex-1">
                        <div className="font-medium text-sm flex items-center gap-2">
                            <span className="text-muted-foreground text-xs">{index + 1}.</span> {section.heading}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 truncate">
                            {section.subheadings.join(' · ')}
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-1">
                    {!isEditing && !isGenerated && (
                        <>
                            <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)} className="h-7 w-7 text-muted-foreground hover:text-foreground">
                                <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => onRemove(section.id)} className="h-7 w-7 text-muted-foreground hover:text-red-400">
                                <X className="h-3.5 w-3.5" />
                            </Button>
                        </>
                    )}
                    {isRegenerating && (
                        <div className="px-2 py-1 bg-blue-500/10 text-blue-500 rounded text-xs font-medium flex items-center gap-1">
                            <RefreshCw className="h-3 w-3 animate-spin" /> Generating
                        </div>
                    )}
                    {isGenerated && !isRegenerating && (
                        <>
                            <Button variant="ghost" size="sm" onClick={copyHtml} className="h-7 px-2 text-xs">
                                {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)} className="h-7 px-2 text-xs">
                                {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => onRegenerate(index)} disabled={isRegenerating} className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground">
                                <RefreshCw className={`h-3 w-3 ${isRegenerating ? 'animate-spin' : ''}`} />
                            </Button>
                        </>
                    )}
                </div>
            </div>
            </div>

            {expanded && generated && (
                <div className="border-t border-border/30 p-4">
                    <div
                        className="prose prose-sm prose-invert max-w-none text-sm text-muted-foreground leading-relaxed [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-foreground [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-foreground/80"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(generated.html) }}
                    />
                </div>
            )}
        </div>
    )
}

// ─── DRAGGABLE OUTLINE CONTAINER ──────────────────────────────────────────────
export default function DraggableOutline({
    pillarId,
    initialOutline,
    sections,
    generatingIndexes,
    onOutlineSaved,
    onRegenerate
}: {
    pillarId: string
    initialOutline: OutlineSection[]
    sections: { index: number; html: string; wordCount: number }[]
    generatingIndexes: Set<number>
    onOutlineSaved: (newOutline: OutlineSection[]) => void
    onRegenerate: (index: number) => void
}) {
    // Add unique internal IDs for DndKit
    const [items, setItems] = useState<(OutlineSection & { id: string })[]>(() =>
        initialOutline.map((item, i) => ({ ...item, id: `s-${i}-${Date.now()}` }))
    )
    const [isSaving, setIsSaving] = useState(false)

    // Sync from parent refresh
    React.useEffect(() => {
        setItems(initialOutline.map((item, i) => ({ ...item, id: `s-${i}-${Date.now()}` })))
    }, [initialOutline])

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    )

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        if (over && active.id !== over.id) {
            setItems((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id)
                const newIndex = items.findIndex((i) => i.id === over.id)
                return arrayMove(items, oldIndex, newIndex)
            })
        }
    }

    const saveChanges = async (currentItems: typeof items) => {
        setIsSaving(true)
        const pureOutline = currentItems.map(({ heading, subheadings }) => ({ heading, subheadings }))
        await updatePillarOutline(pillarId, pureOutline)
        onOutlineSaved(pureOutline)
        setIsSaving(false)
    }

    const handleItemSave = async (id: string, newHeading: string) => {
        const next = items.map(item => item.id === id ? { ...item, heading: newHeading } : item)
        setItems(next)
        await saveChanges(next)
    }

    const handleItemRemove = async (id: string) => {
        const next = items.filter(item => item.id !== id)
        setItems(next)
        await saveChanges(next)
    }

    // A simple prompt to add a new generic section
    const handleAddNewSection = async () => {
        const name = prompt("Enter new section name:")
        if (name && name.trim()) {
            const next = [...items, { id: `s-new-${Date.now()}`, heading: name.trim(), subheadings: ['Custom topic'] }]
            setItems(next)
            await saveChanges(next)
        }
    }

    if (items.length === 0) {
        return (
            <div className="rounded-xl border-2 border-dashed border-border/50 p-10 text-center">
                <Layers className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Click "Generate Outline" to create your article structure</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-2 text-xs text-muted-foreground">
                <p>Drag to reorganize sections before generating.</p>
                {isSaving && <span className="flex items-center gap-1 text-primary"><RefreshCw className="h-3 w-3 animate-spin"/> Saving...</span>}
            </div>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                    <div>
                        {items.map((section, index) => {
                            const generated = sections.find(s => s.index === index)
                            const isRegenerating = generatingIndexes.has(index)
                            return (
                                <SortableItem
                                    key={section.id}
                                    section={section}
                                    index={index}
                                    generated={generated}
                                    isRegenerating={isRegenerating}
                                    onSave={handleItemSave}
                                    onRemove={handleItemRemove}
                                    onRegenerate={onRegenerate}
                                />
                            )
                        })}
                    </div>
                </SortableContext>
            </DndContext>
            
            {!sections.some(s => s.index === items.length - 1) && ( // simple check
                <Button variant="outline" size="sm" onClick={handleAddNewSection} className="w-full border-dashed">
                    + Add Custom Section
                </Button>
            )}
        </div>
    )
}
