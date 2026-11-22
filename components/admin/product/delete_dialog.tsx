'use client'

import { useRouter, usePathname } from "next/navigation"
import { AdminDeleteDialog } from "@/components/admin/shared/admin-delete-dialog"
import { deleteProductAction } from "@/actions/product"

interface DeleteProductDialogProps {
  product: {
    id: string
    name: string
  }
  onDelete?: (productId: string) => void | Promise<void>
  showText?: boolean
}

export function DeleteProductDialog({ product, onDelete, showText = false }: DeleteProductDialogProps) {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <AdminDeleteDialog
      title="Delete Product"
      entityLabel="product"
      ariaLabel={`Delete ${product.name}`}
      confirmLabel="Delete Product"
      showText={showText}
      triggerClassName={showText ? "!bg-red-600 !hover:bg-red-700 !text-white" : undefined}
      confirmClassName="!bg-red-600 !hover:bg-red-700 !text-white"
      toastMessages={{
        success: "Product deleted",
        errorTitle: "Failed to delete product",
      }}
      description={
        <>
          <p>
            Are you sure you want to delete{" "}
            <span className="font-semibold text-foreground">{product.name}</span>?
          </p>
          <p>This action cannot be undone. All associated data will be permanently removed.</p>
        </>
      }
      onConfirm={async () => {
        try {
          if (onDelete) {
            await onDelete(product.id)
          } else {
            const formData = new FormData()
            formData.set("id", product.id)
            const result = await deleteProductAction(formData)
            if (!result.success) return result
          }
        } catch (error) {
          return {
            success: false as const,
            error: error instanceof Error ? error.message : "Failed to delete product",
          }
        }

        // If we're on a product details route (/admin/products/[id]), navigate back to list.
        const segments = pathname?.split("/") ?? []
        const isProductDetailPage =
          segments.length === 4 &&
          segments[2] === "products" &&
          segments[3] !== "create"
        if (isProductDetailPage) {
          router.push("/admin/products")
        } else {
          router.refresh()
        }
      }}
    />
  )
}
