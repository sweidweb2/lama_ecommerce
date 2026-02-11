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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Category } from "@/types/product"

export type AdminCategory = Category

interface CreateCategoryDialogProps {
  parentOptions: AdminCategory[]
  action: (formData: FormData) => void | Promise<void>
}

export function CreateCategoryDialog({
  parentOptions,
  action,
}: CreateCategoryDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [parentId, setParentId] = useState<string | "none">("none")
  const [isActive, setIsActive] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ name?: string; slug?: string }>({})

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const trimmedName = name.trim()
    const trimmedSlug = slug.trim()

    const nextErrors: typeof errors = {}

    if (!trimmedName) {
      nextErrors.name = "Name is required."
    } else if (trimmedName.length > 40) {
      nextErrors.name = "Name must be at most 40 characters."
    }

    if (trimmedSlug.length > 0) {
      if (trimmedSlug.length > 20) {
        nextErrors.slug = "Slug must be at most 20 characters."
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

    const form = e.currentTarget
    const formData = new FormData(form)

    formData.set("name", trimmedName)
    formData.set("slug", trimmedSlug)
    formData.set("parent_id", parentId === "none" ? "" : parentId)
    formData.set("is_active", isActive ? "true" : "false")

    setIsSubmitting(true)
    try {
      await action(formData)

      setName("")
      setSlug("")
      setParentId("none")
      setIsActive(true)
      setOpen(false)
    } catch (error) {
      console.error("Error creating category:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setName("")
    setSlug("")
    setParentId("none")
    setIsActive(true)
    setOpen(false)
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        Add Category
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Create Category</DialogTitle>
          </DialogHeader>

          <form className="space-y-4 mt-2" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="category-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="category-name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={40}
                placeholder="e.g., Electronics"
                required
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-slug">Slug</Label>
              <Input
                id="category-slug"
                name="slug"
                value={slug}
                onChange={(e) =>
                  setSlug(
                    e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9-]/g, "")
                      .slice(0, 20),
                  )
                }
                maxLength={20}
                placeholder="e.g., electronics"
              />
              <p className="text-xs text-muted-foreground">
                URL-friendly identifier. Leave empty to generate later.
              </p>
              {errors.slug && (
                <p className="text-xs text-destructive">{errors.slug}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Parent Category</Label>
              <Select
                value={parentId}
                onValueChange={(value) => setParentId(value as string | "none")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select parent (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No parent (root)</SelectItem>
                  {parentOptions.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Optional. Use this to build nested category trees.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="category-is-active"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
                <Label htmlFor="category-is-active" className="cursor-pointer">
                  Active
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Inactive categories will not be shown in the storefront.
              </p>
            </div>

            <input
              type="hidden"
              name="parent_id"
              value={parentId === "none" ? "" : parentId}
            />
            <input
              type="hidden"
              name="is_active"
              value={isActive ? "true" : "false"}
            />

            <DialogFooter className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

