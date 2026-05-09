'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BulkActionsBar } from './BulkActionsBar'

const STATUS_COLORS: Record<string, string> = {
    QUEUED: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    PROCESSING: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    DONE: 'bg-green-500/10 text-green-400 border-green-500/20',
    ERROR: 'bg-red-500/10 text-red-400 border-red-500/20',
}

interface PostRow {
    id: string
    keyword: string
    status: string
    content: string | null
    createdAt: Date
    batch?: {
        name: string
        site?: { name: string; wpUrl: string } | null
    } | null
}

export function PostsTable({ posts, errorCount }: { posts: PostRow[]; errorCount: number }) {
    const [selectedIds, setSelectedIds] = useState<string[]>([])

    const allSelected = posts.length > 0 && selectedIds.length === posts.length
    const someSelected = selectedIds.length > 0 && !allSelected

    const toggleAll = () => {
        if (allSelected) setSelectedIds([])
        else setSelectedIds(posts.map(p => p.id))
    }

    const toggleOne = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        )
    }

    return (
        <>
            {/* Bulk Actions Toolbar */}
            <BulkActionsBar
                selectedIds={selectedIds}
                errorCount={errorCount}
                onClear={() => setSelectedIds([])}
            />

            {/* Table */}
            <div className="rounded-xl border border-border/50 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border/50 bg-muted/30">
                            <th className="w-10 px-3 py-3">
                                <input
                                    type="checkbox"
                                    checked={allSelected}
                                    ref={el => { if (el) el.indeterminate = someSelected }}
                                    onChange={toggleAll}
                                    className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
                                />
                            </th>
                            <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Site</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Keyword / Title</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Created At</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                        {posts.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-16 text-center text-sm text-muted-foreground">
                                    No articles yet. <Link href="/projects/new" className="text-primary underline">Create your first batch</Link>.
                                </td>
                            </tr>
                        ) : (
                            posts.map((post) => {
                                const contentJson = post.content ? (() => { try { return JSON.parse(post.content) } catch { return null } })() : null
                                const title = contentJson?.title || post.keyword
                                const isSelected = selectedIds.includes(post.id)
                                return (
                                    <tr
                                        key={post.id}
                                        className={`transition-colors ${isSelected ? 'bg-primary/5' : 'hover:bg-muted/20'}`}
                                    >
                                        <td className="w-10 px-3 py-3">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleOne(post.id)}
                                                className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-xs text-muted-foreground">
                                                {post.batch?.site?.name || post.batch?.site?.wpUrl || '—'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Link
                                                href={`/posts/${post.id}`}
                                                className="font-medium hover:text-primary transition-colors"
                                            >
                                                {title}
                                            </Link>
                                            <div className="text-xs text-muted-foreground mt-0.5">{post.keyword}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[post.status] || STATUS_COLORS.QUEUED}`}>
                                                {post.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-muted-foreground">
                                            {new Date(post.createdAt).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                            })}
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </>
    )
}
