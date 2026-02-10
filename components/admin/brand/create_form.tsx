'use client'

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"
import type { Brand } from "@/types/product"

export type AdminBrand = Brand

interface CreateBrandDialogProps {
  onCreated?: (brand: AdminBrand) => void
}

export function CreateBrandDialog({ onCreated }: CreateBrandDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [logoUrl, setLogoUrl] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const now = new Date().toISOString()
    const newBrand: AdminBrand = {
      id: crypto.randomUUID(),
      name: name.trim(),
      slug: slug.trim() || null,
      logo_image_url: logoUrl.trim() || null,
      created_at: now,
      deleted_at: null,
    }

    // For now we only update local state via callback; API wiring can be added later.
    onCreated?.(newBrand)

    setName("")
    setSlug("")
    setLogoUrl("")
    setOpen(false)
  }

  const handleCancel = () => {
    setName("")
    setSlug("")
    setLogoUrl("")
    setOpen(false)
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Add Brand
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Create Brand</DialogTitle>
          </DialogHeader>

          <form className="space-y-4 mt-2" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="brand-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="brand-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Lama Tech"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand-slug">Slug</Label>
              <Input
                id="brand-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
                placeholder="e.g., lama-tech"
              />
              <p className="text-xs text-muted-foreground">
                URL-friendly identifier. Leave empty to generate later.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand-logo-url">Logo URL</Label>
              <Input
                id="brand-logo-url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://..."
              />
              <p className="text-xs text-muted-foreground">
                Optional logo image URL for this brand.
              </p>
            </div>

            <DialogFooter className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button type="submit">
                Create Brand
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

