'use client'

import { AdminDeleteDialog } from "@/components/admin/shared/admin-delete-dialog"
import type { Brand } from "@/types/product"

type DeleteBrandActionResult =
  | { success: true }
  | { success: false; error: string }

interface DeleteBrandDialogProps {
  brand: Brand
  action: (formData: FormData) => Promise<DeleteBrandActionResult>
  showText?: boolean
}

export function DeleteBrandDialog({
  brand,
  action,
  showText = false,
}: DeleteBrandDialogProps) {
  return (
    <AdminDeleteDialog
      title="Delete Brand"
      entityLabel="brand"
      ariaLabel={`Delete brand ${brand.name}`}
      confirmLabel="Delete Brand"
      showText={showText}
      toastMessages={{
        success: "Brand deleted",
        errorTitle: "Cannot delete brand",
      }}
      description={
        <>
          <p>
            Are you sure you want to delete the brand{" "}
            <span className="font-semibold text-foreground">{brand.name}</span>?
          </p>
          <p>
            Brands with products assigned cannot be deleted. Reassign or
            remove those products first. This action cannot be undone.
          </p>
        </>
      }
      onConfirm={() => {
        const formData = new FormData()
        formData.set("id", brand.id)
        formData.set("logo_url", brand.logo_image_url ?? "")
        return action(formData)
      }}
    />
  )
}
