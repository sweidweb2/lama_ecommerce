'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { deleteProductVariantAction } from "@/actions/product"
import { toast } from "sonner"
import type { ProductVariant } from "./VariantsTable"

interface DeleteVariantDialogProps {
  variant: ProductVariant
}

export function DeleteVariantDialog({ variant }: DeleteVariantDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.set("variant_id", variant.id)
      formData.set("product_id", variant.product_id)

      const result = await deleteProductVariantAction(formData)

      if (!result.success) {
        setError(result.error)
        toast.error(result.error)
        return
      }

      toast.success("Variant deleted")
      router.refresh()
      setOpen(false)
    } catch (err) {
      console.error("Error deleting variant:", err)
      const message =
        err instanceof Error
          ? err.message
          : "Failed to delete variant. Please try again."
      setError(message)
      toast.error(message)
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
        onClick={() => {
          setError(null)
          setOpen(true)
        }}
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
            <p>
              This action cannot be undone. Variants with order history, cart
              items, or wishlist items cannot be deleted.
            </p>
            {error && (
              <p className="text-sm text-destructive font-medium">{error}</p>
            )}
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
