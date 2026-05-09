'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Plus, Trash2, Search, Crosshair, Sparkles, PlusCircle, Check } from "lucide-react"
import { addSpyKeyword, deleteSpyKeyword, updateSpyKeywordStatus } from "@/app/actions/spy-keywords"
import { generateKeywordIdeas } from "@/app/actions/ideas"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

interface SpyKeyword {
  id: string
  keyword: string
  status: string
  notes: string | null
  source: string
  rank: number | null
  relatedTerms: string | null
  createdAt: Date
  updatedAt: Date
}

export default function SpyListClient({ initialKeywords }: { initialKeywords: SpyKeyword[] }) {
  const [keywords, setKeywords] = useState<SpyKeyword[]>(initialKeywords)
  const [search, setSearch] = useState('')
  const [isPending, startTransition] = useTransition()
  
  // Add new keyword state
  const [newKeyword, setNewKeyword] = useState('')
  const [newNotes, setNewNotes] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  
  // Keyword Generator State
  const [generatorOpen, setGeneratorOpen] = useState(false)
  const [seedKeyword, setSeedKeyword] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedIdeas, setGeneratedIdeas] = useState<{keyword: string, rank: number, source: string}[]>([])

  // Handlers for Generator
  const handleGenerate = async () => {
    if (!seedKeyword.trim()) return
    setIsGenerating(true)
    
    try {
      const res = await generateKeywordIdeas(seedKeyword)
      if (res.success && res.ideas) {
        setGeneratedIdeas(res.ideas)
        toast.success(`Found ${res.ideas.length} keyword ideas!`)
      } else {
        toast.error(res.error || "Failed to generate ideas")
      }
    } catch (err) {
      toast.error("An error occurred")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAddGenerated = async (idea: {keyword: string, rank: number, source: string}) => {
    try {
      const res = await addSpyKeyword({
        keyword: idea.keyword,
        source: idea.source,
        rank: idea.rank,
        notes: `Generated from seed: ${seedKeyword}`
      })
      if (res.success && res.keyword) {
        toast.success("Keyword added to Spy List")
        setKeywords([res.keyword as SpyKeyword, ...keywords])
      } else {
        toast.error(res.error || "Failed to add keyword")
      }
    } catch (err) {
      toast.error("An error occurred")
    }
  }

  const handleAdd = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!newKeyword.trim()) return

    startTransition(async () => {
      const result = await addSpyKeyword({ keyword: newKeyword, notes: newNotes })
      if (result.success && result.keyword) {
        toast.success('Keyword added to spy list')
        setKeywords([result.keyword as SpyKeyword, ...keywords])
        setNewKeyword('')
        setNewNotes('')
        setIsAdding(false)
      } else {
        toast.error(result.error || 'Failed to add keyword')
      }
    })
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteSpyKeyword(id)
      if (result.success) {
        toast.success('Keyword deleted')
        setKeywords(keywords.filter(k => k.id !== id))
      } else {
        toast.error(result.error || 'Failed to delete keyword')
      }
    })
  }

  const handleStatusChange = (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'NEW' ? 'IN_PROGRESS' : currentStatus === 'IN_PROGRESS' ? 'USED' : 'NEW'
    
    startTransition(async () => {
      const result = await updateSpyKeywordStatus(id, nextStatus)
      if (result.success && result.keyword) {
        toast.success(`Status updated to ${nextStatus}`)
        setKeywords(keywords.map(k => k.id === id ? result.keyword as SpyKeyword : k))
      } else {
        toast.error(result.error || 'Failed to update status')
      }
    })
  }

  const filteredKeywords = keywords.filter(k => 
    k.keyword.toLowerCase().includes(search.toLowerCase()) || 
    (k.notes && k.notes.toLowerCase().includes(search.toLowerCase()))
  )

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'NEW': return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20'
      case 'IN_PROGRESS': return 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20'
      case 'USED': return 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
      default: return 'bg-gray-500/10 text-gray-500'
    }
  }

  return (
    <div className="space-y-6">
      {/* Add Keyword Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border/50 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-border/50">
              <h3 className="text-xl font-bold">Add Spy Keyword</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Enter a keyword you want to track or analyze later.
              </p>
            </div>
            
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Keyword</label>
                <Input
                  required
                  placeholder="e.g. aesthetic wallpaper"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes (Optional)</label>
                <Input
                  placeholder="e.g. competitor idea, high volume"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setIsAdding(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={isPending}
                >
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Keyword
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Idea Generator Modal */}
      {generatorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border/50 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-border/50 bg-gradient-to-r from-primary/10 to-transparent">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-bold">Keyword Idea Generator</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Enter a broad seed keyword to generate highly relevant autocomplete suggestions.
              </p>
            </div>
            
            <div className="p-6 border-b border-border/50">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter a seed keyword (e.g. home decor)"
                  value={seedKeyword}
                  onChange={(e) => setSeedKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                />
                <Button 
                  onClick={handleGenerate}
                  disabled={isGenerating || !seedKeyword.trim()}
                >
                  {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                  Generate
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-background/50">
              {!generatedIdeas.length && !isGenerating ? (
                <div className="h-40 flex flex-col items-center justify-center text-muted-foreground opacity-60">
                  <Sparkles className="h-10 w-10 mb-2 opacity-50" />
                  <p>Ideas will appear here</p>
                </div>
              ) : isGenerating ? (
                <div className="h-40 flex flex-col items-center justify-center text-primary">
                  <Loader2 className="h-8 w-8 animate-spin mb-4" />
                  <p className="animate-pulse">Scraping suggestions...</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium mb-3 text-muted-foreground flex items-center justify-between">
                    <span>Generated Suggestions</span>
                    <Badge variant="outline">{generatedIdeas.length} found</Badge>
                  </h4>
                  <div className="grid gap-2">
                    {generatedIdeas.map((idea, idx) => {
                      const isAlreadyAdded = keywords.some(k => k.keyword.toLowerCase() === idea.keyword.toLowerCase());
                      return (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card hover:border-primary/30 transition-colors group">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                              {idea.rank}
                            </div>
                            <span className="font-medium">{idea.keyword}</span>
                          </div>
                          <Button 
                            size="sm" 
                            variant={isAlreadyAdded ? "ghost" : "secondary"}
                            className={isAlreadyAdded ? "text-green-500 opacity-50 cursor-default" : "opacity-0 group-hover:opacity-100 transition-opacity"}
                            onClick={() => !isAlreadyAdded && handleAddGenerated(idea)}
                            disabled={isAlreadyAdded}
                          >
                            {isAlreadyAdded ? <Check className="h-4 w-4" /> : (
                              <>
                                <PlusCircle className="h-4 w-4 mr-2" />
                                Add
                              </>
                            )}
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-border/50 flex justify-end">
              <Button variant="ghost" onClick={() => setGeneratorOpen(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Filter and List Header */}
      <div className="flex justify-between items-center">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search your spy list..."
            className="pl-9 bg-surface-container-low border-border/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="bg-primary/10 text-primary hover:bg-primary/20 transition-all border border-primary/20"
            onClick={() => setGeneratorOpen(true)}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Idea Generator
          </Button>
          <Button 
            onClick={() => setIsAdding(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Keyword
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredKeywords.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed rounded-xl bg-surface-container-low/50">
            {search ? "No keywords found matching your search." : "Your spy list is empty. Add some keywords above!"}
          </div>
        ) : (
          filteredKeywords.map((kw) => (
            <Card key={kw.id} className="bg-surface-container-low border-border/50 hover:bg-surface-container/80 transition-colors group">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-lg leading-tight line-clamp-2 pr-2" title={kw.keyword}>
                    {kw.keyword}
                  </h3>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity -mt-1 -mr-2"
                    onClick={() => handleDelete(kw.id)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-4 w-4 hover:text-red-400" />
                  </Button>
                </div>
                
                {kw.notes && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2" title={kw.notes}>
                    {kw.notes}
                  </p>
                )}

                <div className="flex items-center gap-2 mb-4 text-xs">
                  <Badge variant="outline" className="bg-surface-container-high text-muted-foreground">
                    {kw.source}
                  </Badge>
                  {kw.rank !== null && (
                    <span className="text-muted-foreground flex items-center gap-1">
                      Rank/Vol: <strong className="text-foreground">{kw.rank}</strong>
                    </span>
                  )}
                </div>

                <div className="flex justify-between items-center mt-auto pt-4 border-t border-border/40">
                  <Badge 
                    variant="outline" 
                    className={`cursor-pointer transition-colors ${getStatusColor(kw.status)}`}
                    onClick={() => handleStatusChange(kw.id, kw.status)}
                  >
                    {kw.status.replace('_', ' ')}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(kw.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
