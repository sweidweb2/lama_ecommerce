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
import { Trash2 } from "lucide-react"
import type { Category } from "@/types/product"

interface DeleteCategoryDialogProps {
  category: Category
  action: (formData: FormData) => void | Promise<void>
  showText?: boolean
}

export function DeleteCategoryDialog({
  category,
  action,
  showText = false,
}: DeleteCategoryDialogProps) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const form = e.currentTarget
    const formData = new FormData(form)

    setIsDeleting(true)
    try {
      await action(formData)
      setOpen(false)
    } catch (error) {
      console.error("Error deleting category:", error)
      // TODO: Show error toast
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Button
        variant={showText ? "destructive" : "ghost"}
        size={showText ? "default" : "icon"}
        onClick={() => setOpen(true)}
        aria-label={`Delete category ${category.name}`}
      >
        <Trash2 className={`h-4 w-4 ${showText ? "mr-2" : ""}`} />
        {showText && "Delete"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleDelete}>
            <input type="hidden" name="id" value={category.id} />
            <div className="space-y-2 text-sm text-muted-foreground mt-2">
              <p>
                Are you sure you want to delete the category{" "}
                <span className="font-semibold text-foreground">{category.name}</span>?
              </p>
              <p>
                Products that use this category will still exist but may show without a category
                until reassigned. This action cannot be undone.
              </p>
            </div>
            <DialogFooter className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete Category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

