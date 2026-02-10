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
import { Edit } from "lucide-react"
import type { AdminCategory } from "./create_form"

interface EditCategoryDialogProps {
  category: AdminCategory
  allCategories: AdminCategory[]
  onUpdated?: (category: AdminCategory) => void
}

export function EditCategoryDialog({
  category,
  allCategories,
  onUpdated,
}: EditCategoryDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(category.name)
  const [slug, setSlug] = useState(category.slug ?? "")
  const [parentId, setParentId] = useState<string | "none">(
    category.parent_id ?? "none",
  )
  const [isActive, setIsActive] = useState(category.is_active)

  const parentOptions = allCategories.filter((c) => c.id !== category.id)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const updatedCategory: AdminCategory = {
      ...category,
      name: name.trim(),
      slug: slug.trim() || null,
      parent_id: parentId === "none" ? null : parentId,
      is_active: isActive,
    }

    onUpdated?.(updatedCategory)
    setOpen(false)
  }

  const handleCancel = () => {
    setName(category.name)
    setSlug(category.slug ?? "")
    setParentId(category.parent_id ?? "none")
    setIsActive(category.is_active)
    setOpen(false)
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        aria-label={`Edit category ${category.name}`}
      >
        <Edit className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>

          <form className="space-y-4 mt-2" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor={`category-name-${category.id}`}>
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id={`category-name-${category.id}`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Electronics"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`category-slug-${category.id}`}>Slug</Label>
              <Input
                id={`category-slug-${category.id}`}
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
                placeholder="e.g., electronics"
              />
              <p className="text-xs text-muted-foreground">
                URL-friendly identifier. Leave empty to generate later.
              </p>
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
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`category-is-active-${category.id}`}
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
                <Label
                  htmlFor={`category-is-active-${category.id}`}
                  className="cursor-pointer"
                >
                  Active
                </Label>
              </div>
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

