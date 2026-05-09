'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Plus, Trash2, Edit, Save, X, Check, Globe } from "lucide-react"
import { createSite, updateSite, deleteSite, testSiteConnection } from "@/app/actions/sites"
import { useRouter } from 'next/navigation'

interface Site {
  id: string
  name: string
  wpUrl: string
  wpUser: string
  wpAppPass: string
  isDefault: boolean
}

interface SitesListProps {
  initialSites: Site[]
}

export function SitesList({ initialSites }: SitesListProps) {
  const [sites, setSites] = useState<Site[]>(initialSites)
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    wpUrl: '',
    wpUser: '',
    wpAppPass: '',
    isDefault: false
  })

  // Test connection state
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const resetForm = () => {
    setFormData({
      name: '',
      wpUrl: '',
      wpUser: '',
      wpAppPass: '',
      isDefault: false
    })
    setIsAdding(false)
    setEditingId(null)
    setTestResult(null)
  }

  const handleEdit = (site: Site) => {
    setFormData({
      name: site.name,
      wpUrl: site.wpUrl,
      wpUser: site.wpUser,
      wpAppPass: site.wpAppPass,
      isDefault: site.isDefault
    })
    setEditingId(site.id)
    setIsAdding(false)
    setTestResult(null)
  }

  const handleTestConnection = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const result = await testSiteConnection(formData.wpUrl, formData.wpUser, formData.wpAppPass)
      setTestResult({
        success: result.success,
        message: result.success ? (result.message || 'Connected successfully') : (result.error || 'Connection failed')
      })
    } catch (e: any) {
      setTestResult({ success: false, message: e.message })
    } finally {
      setTesting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      if (editingId) {
        // Update existing site
        const result = await updateSite(editingId, formData)
        if (result.success) {
          router.refresh()
          // Update local state optimistically
          setSites(sites.map(s => s.id === editingId ? { ...s, ...formData } : formData.isDefault ? { ...s, isDefault: false } : s))
          resetForm()
        }
      } else {
        // Create new site
        const result = await createSite(formData)
        if (result.success && result.site) {
          router.refresh()
          setSites([result.site, ...sites.map(s => formData.isDefault ? { ...s, isDefault: false } : s)])
          resetForm()
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this site?')) return
    
    setLoading(true)
    try {
      await deleteSite(id)
      setSites(sites.filter(s => s.id !== id))
      router.refresh()
      if (editingId === id) resetForm()
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Configured Sites</h2>
        {!isAdding && !editingId && (
          <Button onClick={() => setIsAdding(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add Site
          </Button>
        )}
      </div>

      {/* Form for Add/Edit */}
      {(isAdding || editingId) && (
        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Site' : 'Add New Site'}</CardTitle>
            <CardDescription>Configure WordPress connection details</CardDescription>
          </CardHeader>
          <CardContent>
            <form id="site-form" onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Site Name</Label>
                <Input 
                  id="name" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="My Awesome Blog"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="wpUrl">WordPress URL</Label>
                <Input 
                  id="wpUrl" 
                  value={formData.wpUrl} 
                  onChange={e => setFormData({...formData, wpUrl: e.target.value})}
                  placeholder="https://example.com"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="wpUser">Username</Label>
                  <Input 
                    id="wpUser" 
                    value={formData.wpUser} 
                    onChange={e => setFormData({...formData, wpUser: e.target.value})}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="wpAppPass">App Password</Label>
                  <Input 
                    id="wpAppPass" 
                    type="password"
                    value={formData.wpAppPass} 
                    onChange={e => setFormData({...formData, wpAppPass: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="isDefault" 
                  checked={formData.isDefault}
                  onCheckedChange={(checked) => setFormData({...formData, isDefault: checked as boolean})}
                />
                <Label htmlFor="isDefault">Set as default site</Label>
              </div>

              {testResult && (
                <div className={`text-sm p-2 rounded ${testResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {testResult.success ? <Check className="h-4 w-4 inline mr-1" /> : <X className="h-4 w-4 inline mr-1" />}
                  {testResult.message}
                </div>
              )}
            </form>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={handleTestConnection} disabled={testing || !formData.wpUrl}>
              {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Test Connection'}
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={resetForm}>Cancel</Button>
              <Button type="submit" form="site-form" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Site
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}

      {/* List of Sites */}
      <div className="grid gap-4">
        {sites.length === 0 && !isAdding ? (
          <div className="col-span-full border-2 border-dashed rounded-xl py-20 bg-surface-container-low flex flex-col items-center justify-center text-center space-y-4">
            <div className="p-4 bg-surface-container-high rounded-full shadow-sm">
              <Globe className="h-8 w-8 text-foreground/40" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-semibold">No Sites Connected</h3>
              <p className="text-muted-foreground max-w-sm mx-auto text-sm">
                Connect your first WordPress site to enable automated publishing. You'll need an Application Password from your WordPress admin dashboard.
              </p>
            </div>
            <Button className="gap-2 mt-2" onClick={() => setIsAdding(true)}>
              <Plus className="h-4 w-4" />
              Connect Site
            </Button>
          </div>
        ) : (
          sites.map(site => (
            <Card key={site.id} className={site.isDefault ? 'border-primary/50 bg-primary/5' : ''}>
              <CardContent className="p-6 flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{site.name}</h3>
                    {site.isDefault && <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">Default</span>}
                  </div>
                  <p className="text-sm text-muted-foreground">{site.wpUrl}</p>
                  <p className="text-xs text-muted-foreground mt-1">User: {site.wpUser}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(site)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(site.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
