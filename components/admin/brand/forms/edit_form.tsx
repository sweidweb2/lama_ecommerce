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
import type { Brand } from "@/types/product"
import {
  updateBrandSchema,
  type UpdateBrandInput,
} from "@/lib/validators/brand"

interface EditBrandDialogProps {
  brand: Brand
  action: (formData: FormData) => void | Promise<void>
}

export function EditBrandDialog({ brand, action }: EditBrandDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(brand.name)
  const [slug, setSlug] = useState(brand.slug ?? "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<
    Partial<Record<keyof UpdateBrandInput, string>>
  >({})

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)

    const parsed = updateBrandSchema.safeParse({
      name: name.trim(),
      slug: slug.trim() || null,
    })

    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof UpdateBrandInput, string>> = {}
      for (const issue of parsed.error.issues) {
        const pathKey = issue.path[0] as keyof UpdateBrandInput
        if (pathKey && !fieldErrors[pathKey]) {
          fieldErrors[pathKey] = issue.message
        }
      }
      setErrors(fieldErrors)
      return
    }

    setErrors({})

    formData.set("name", parsed.data.name)
    formData.set("slug", parsed.data.slug ?? "")

    setIsSubmitting(true)
    try {
      await action(formData)
      setOpen(false)
    } catch (error) {
      console.error("Failed to update brand:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setName(brand.name)
    setSlug(brand.slug ?? "")
    setErrors({})
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
            <input type="hidden" name="id" value={brand.id} />
            <input
              type="hidden"
              name="current_logo_url"
              value={brand.logo_image_url ?? ""}
            />
            <div className="space-y-2">
              <Label htmlFor={`brand-name-${brand.id}`}>
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id={`brand-name-${brand.id}`}
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                placeholder="e.g., Northline"
                required
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor={`brand-slug-${brand.id}`}>Slug</Label>
              <Input
                id={`brand-slug-${brand.id}`}
                name="slug"
                value={slug}
                onChange={(e) =>
                  setSlug(
                    e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9-]/g, "")
                      .slice(0, 50),
                  )
                }
                maxLength={50}
                placeholder="e.g., northline"
              />
              <p className="text-xs text-muted-foreground">
                URL-friendly identifier. Leave empty to generate later.
              </p>
              {errors.slug && (
                <p className="text-xs text-destructive">{errors.slug}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor={`brand-logo-file-${brand.id}`}>Logo Image</Label>
              <Input
                id={`brand-logo-file-${brand.id}`}
                name="logo_file"
                type="file"
                accept="image/*"
              />
              <p className="text-xs text-muted-foreground">
                Upload a new logo to replace the existing one (optional).
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
              <Button type="submit" loading={isSubmitting}>
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
