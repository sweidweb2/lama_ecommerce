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
import { Edit } from "lucide-react"
import type { AdminBrand } from "./create_form"

interface EditBrandDialogProps {
  brand: AdminBrand
  onUpdated?: (brand: AdminBrand) => void
}

export function EditBrandDialog({ brand, onUpdated }: EditBrandDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(brand.name)
  const [slug, setSlug] = useState(brand.slug ?? "")
  const [logoUrl, setLogoUrl] = useState(brand.logo_image_url ?? "")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const updatedBrand: AdminBrand = {
      ...brand,
      name: name.trim(),
      slug: slug.trim() || null,
      logo_image_url: logoUrl.trim() || null,
    }

    onUpdated?.(updatedBrand)
    setOpen(false)
  }

  const handleCancel = () => {
    setName(brand.name)
    setSlug(brand.slug ?? "")
    setLogoUrl(brand.logo_image_url ?? "")
    setOpen(false)
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        aria-label={`Edit brand ${brand.name}`}
      >
        <Edit className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Brand</DialogTitle>
          </DialogHeader>

          <form className="space-y-4 mt-2" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor={`brand-name-${brand.id}`}>
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id={`brand-name-${brand.id}`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Lama Tech"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`brand-slug-${brand.id}`}>Slug</Label>
              <Input
                id={`brand-slug-${brand.id}`}
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
                placeholder="e.g., lama-tech"
              />
              <p className="text-xs text-muted-foreground">
                URL-friendly identifier. Leave empty to generate later.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`brand-logo-url-${brand.id}`}>Logo URL</Label>
              <Input
                id={`brand-logo-url-${brand.id}`}
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
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

