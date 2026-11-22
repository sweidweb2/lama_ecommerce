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
import {
  createBrandSchema,
  type CreateBrandInput,
} from "@/lib/validators/brand"
import {
  MAX_SERVER_ACTION_UPLOAD_BYTES,
  MAX_SERVER_ACTION_UPLOAD_LABEL,
} from "@/lib/constants/uploads"
import { toast } from "sonner"

interface CreateBrandDialogProps {
  action: (formData: FormData) => void | Promise<void>
}

export function CreateBrandDialog({ action }: CreateBrandDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<
    Partial<Record<keyof CreateBrandInput, string>>
  >({})

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)

    const parsed = createBrandSchema.safeParse({
      name: name.trim(),
      slug: slug.trim() || null,
    })

    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof CreateBrandInput, string>> = {}
      for (const issue of parsed.error.issues) {
        const pathKey = issue.path[0] as keyof CreateBrandInput
        if (pathKey && !fieldErrors[pathKey]) {
          fieldErrors[pathKey] = issue.message
        }
      }
      setErrors(fieldErrors)
      return
    }

    setErrors({})

    const logoInput = form.elements.namedItem("logo_file")
    if (logoInput instanceof HTMLInputElement && logoInput.files?.[0]) {
      if (logoInput.files[0].size > MAX_SERVER_ACTION_UPLOAD_BYTES) {
        toast.error(
          `Logo must be ${MAX_SERVER_ACTION_UPLOAD_LABEL} or smaller`,
        )
        return
      }
    }

    formData.set("name", parsed.data.name)
    formData.set("slug", parsed.data.slug ?? "")

    setIsSubmitting(true)
    try {
      await action(formData)
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
    setErrors({})
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
                placeholder="e.g., Northline"
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
              <Label htmlFor="brand-logo-file">Logo Image</Label>
              <Input
                id="brand-logo-file"
                name="logo_file"
                type="file"
                accept="image/*"
              />
              <p className="text-xs text-muted-foreground">
                Upload a logo image for this brand. Max{" "}
                {MAX_SERVER_ACTION_UPLOAD_LABEL}.
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
                Create Brand
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
