import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function WebsiteContentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Website Content</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Manage banners, homepage content, and static pages
        </p>
      </div>

      <Tabs defaultValue="banners" className="space-y-4">
        <TabsList>
          <TabsTrigger value="banners">Banners</TabsTrigger>
          <TabsTrigger value="homepage">Homepage</TabsTrigger>
          <TabsTrigger value="pages">Static Pages</TabsTrigger>
        </TabsList>

        <TabsContent value="banners" className="space-y-4">
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-semibold">Hero Banner</h3>
            <div className="space-y-2">
              <Label htmlFor="hero-title">Title</Label>
              <Input id="hero-title" placeholder="Enter banner title" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hero-description">Description</Label>
              <Textarea
                id="hero-description"
                placeholder="Enter banner description"
              />
            </div>
            <Button>Save Changes</Button>
          </div>
        </TabsContent>

        <TabsContent value="homepage" className="space-y-4">
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-semibold">Homepage Content</h3>
            <div className="space-y-2">
              <Label htmlFor="homepage-title">Page Title</Label>
              <Input id="homepage-title" placeholder="Enter page title" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="homepage-meta">Meta Description</Label>
              <Textarea
                id="homepage-meta"
                placeholder="Enter meta description"
              />
            </div>
            <Button>Save Changes</Button>
          </div>
        </TabsContent>

        <TabsContent value="pages" className="space-y-4">
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold">Static Pages</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-md border p-3">
                <span className="text-sm font-medium">About Us</span>
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <span className="text-sm font-medium">Terms & Conditions</span>
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <span className="text-sm font-medium">Privacy Policy</span>
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
