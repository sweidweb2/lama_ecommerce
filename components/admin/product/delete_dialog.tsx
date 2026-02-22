'use client'

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
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
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      if (onDelete) {
        await onDelete(product.id)
      } else {
        const formData = new FormData()
        formData.set("id", product.id)
        await deleteProductAction(formData)
      }

      // If we're on a product details route (/admin/products/[id]), navigate back to list.
      const segments = pathname?.split("/") ?? []
      const isProductDetailPage =
        segments.length === 4 &&
        segments[2] === "products" &&
        segments[3] !== "grid" &&
        segments[3] !== "create"
      if (isProductDetailPage) {
        router.push("/admin/products")
      } else {
        router.refresh()
      }

      setOpen(false)
    } catch (error) {
      console.error("Error deleting product:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Button
        variant={showText ? "destructive" : "ghost"}
        size={showText ? "default" : "icon"}
        className={showText ? "!bg-red-600 !hover:bg-red-700 !text-white" : ""}
        onClick={() => setOpen(true)}
        aria-label={`Delete ${product.name}`}
      >
        <Trash2 className={`h-4 w-4 ${showText ? "mr-2" : ""}`} />
        {showText && "Delete"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm text-muted-foreground mt-2">
            <p>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">{product.name}</span>?
            </p>
            <p>This action cannot be undone. All associated data will be permanently removed.</p>
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
              type="button"
              variant="destructive"
              className="!bg-red-600 !hover:bg-red-700 !text-white"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
