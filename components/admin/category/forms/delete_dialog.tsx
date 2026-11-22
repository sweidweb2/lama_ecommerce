'use client'

import { AdminDeleteDialog } from "@/components/admin/shared/admin-delete-dialog"
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
  return (
    <AdminDeleteDialog
      title="Delete Category"
      entityLabel="category"
      ariaLabel={`Delete category ${category.name}`}
      confirmLabel="Delete Category"
      showText={showText}
      toastMessages={{
        success: "Category deleted",
        errorTitle: "Cannot delete category",
      }}
      description={
        <>
          <p>
            Are you sure you want to delete the category{" "}
            <span className="font-semibold text-foreground">{category.name}</span>?
          </p>
          <p>
            Categories with products assigned cannot be deleted. Reassign
            those products first. Child categories will be moved to this
            category&apos;s parent. This action cannot be undone.
          </p>
        </>
      }
      onConfirm={() => {
        const formData = new FormData()
        formData.set("id", category.id)
        return action(formData)
      }}
    />
  )
}
