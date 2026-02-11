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
interface CreateBrandDialogProps {
  action: (formData: FormData) => void | Promise<void>
}

export function CreateBrandDialog({ action }: CreateBrandDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ name?: string; slug?: string }>({})

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)

    const trimmedName = name.trim()
    const trimmedSlug = slug.trim()

    const nextErrors: typeof errors = {}

    if (!trimmedName) {
      nextErrors.name = "Name is required."
    } else if (trimmedName.length > 100) {
      nextErrors.name = "Name must be at most 100 characters."
    }

    if (trimmedSlug.length > 0) {
      if (trimmedSlug.length > 50) {
        nextErrors.slug = "Slug must be at most 50 characters."
      } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(trimmedSlug)) {
        nextErrors.slug =
          "Slug can only contain lowercase letters, numbers, and hyphens."
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setErrors({})

    formData.set("name", trimmedName)
    formData.set("slug", trimmedSlug)

    setIsSubmitting(true)
    try {
      await action(formData)
      // Reset and close on success
      setName("")
      setSlug("")
      setOpen(false)
    } catch (error) {
      console.error("Failed to create brand:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setName("")
    setSlug("")
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
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                placeholder="e.g., Lama Tech"
                required
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand-slug">Slug</Label>
              <Input
                id="brand-slug"
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
                placeholder="e.g., lama-tech"
              />
              <p className="text-xs text-muted-foreground">
                URL-friendly identifier. Leave empty to generate later.
              </p>
              {errors.slug && (
                <p className="text-xs text-destructive">{errors.slug}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand-logo-file">Logo Image</Label>
              <Input
                id="brand-logo-file"
                name="logo_file"
                type="file"
                accept="image/*"
              />
              <p className="text-xs text-muted-foreground">
                Upload a logo image for this brand.
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
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Brand"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

