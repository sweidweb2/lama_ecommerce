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
import { toast } from "sonner"
import type { Category } from "@/types/product"

type DeleteCategoryActionResult =
  | { success: true }
  | { success: false; error: string }

interface DeleteCategoryDialogProps {
  category: Category
  action: (formData: FormData) => Promise<DeleteCategoryActionResult>
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
      const result = await action(formData)
      if (!result.success) {
        toast.error("Cannot delete category", {
          description: result.error,
        })
        return
      }
      toast.success("Category deleted")
      setOpen(false)
    } catch (error) {
      console.error("Error deleting category:", error)
      toast.error("Failed to delete category")
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
                Categories with products assigned cannot be deleted. Reassign
                those products first. Child categories will be moved to this
                category&apos;s parent. This action cannot be undone.
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
                loading={isDeleting}
              >
                Delete Category
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
