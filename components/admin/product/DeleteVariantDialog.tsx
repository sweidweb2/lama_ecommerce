'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { deleteProductVariantAction } from "@/actions/product"
import type { ProductVariant } from "./VariantsTable"

interface DeleteVariantDialogProps {
  variant: ProductVariant
}

export function DeleteVariantDialog({ variant }: DeleteVariantDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const formData = new FormData()
      formData.set("variant_id", variant.id)
      formData.set("product_id", variant.product_id)

      await deleteProductVariantAction(formData)

      // Refresh to show updated variant list
      router.refresh()
      setOpen(false)
    } catch (error) {
      console.error("Error deleting variant:", error)
      // Keep dialog open on error so user can try again
    } finally {
      setIsDeleting(false)
    }
  }

  const variantDescription = [
    variant.color && `Color: ${variant.color}`,
    variant.size && `Size: ${variant.size}`,
    variant.material && `Material: ${variant.material}`,
  ].filter(Boolean).join(", ") || "Variant"

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        aria-label={`Delete variant ${variant.id}`}
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product Variant</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm text-muted-foreground mt-2">
            <p>
              Are you sure you want to delete this variant?
            </p>
            <p className="font-semibold text-foreground">{variantDescription}</p>
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
              onClick={handleDelete}
              disabled={isDeleting}
              className="!bg-red-600 !hover:bg-red-700 !text-white"
            >
              {isDeleting ? "Deleting..." : "Delete Variant"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
