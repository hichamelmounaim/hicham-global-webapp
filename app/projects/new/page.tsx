import { createBatch } from "@/app/actions/batch"
import { getSites } from "@/app/actions/sites"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"

export default async function NewProjectPage() {
    const sitesResult = await getSites()
    const sites = sitesResult.success ? sitesResult.sites || [] : []
    const defaultSite = sites.find(s => s.isDefault) || sites[0]

    return (
        <div className="container mx-auto py-10 max-w-2xl">
            <Card>
                <CardHeader>
                    <CardTitle>Create New Batch</CardTitle>
                    <CardDescription>
                        Enter a name for this batch and paste your keywords (one per line).
                    </CardDescription>
                </CardHeader>
                <form action={createBatch}>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Batch Name</Label>
                            <Input
                                id="name"
                                name="name"
                                placeholder="e.g., Chocolate Cake Recipes - Feb 2026"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="siteId">WordPress Site</Label>
                            {sites.length === 0 ? (
                                <div className="text-sm text-muted-foreground p-3 bg-muted/20 rounded">
                                    No sites configured. <Link href="/sites" className="text-primary hover:underline">Add a site first</Link>.
                                </div>
                            ) : (
                                <Select name="siteId" defaultValue={defaultSite?.id} required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a site" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {sites.map(site => (
                                            <SelectItem key={site.id} value={site.id}>
                                                {site.name} {site.isDefault && '(Default)'} - {site.wpUrl}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="keywords">Keywords</Label>
                            <Textarea
                                id="keywords"
                                name="keywords"
                                placeholder="Chocolate Cake&#10;Vanilla Cupcakes&#10;Strawberry Shortcake"
                                required
                                className="min-h-[200px] font-mono"
                            />
                            <p className="text-sm text-muted-foreground">
                                Enter one keyword per line. We will generate one post per keyword.
                            </p>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" size="lg" className="w-full" disabled={sites.length === 0}>
                            Create Batch & Queue Jobs
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
