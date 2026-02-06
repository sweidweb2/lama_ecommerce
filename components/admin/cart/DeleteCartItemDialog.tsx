'use client'

import { useState } from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import type { CartItem } from "./EditCartItemDialog"

interface DeleteCartItemDialogProps {
  cartItem: CartItem
  onDelete?: (cartItemId: string) => void | Promise<void>
  showText?: boolean
}

export function DeleteCartItemDialog({ cartItem, onDelete, showText = false }: DeleteCartItemDialogProps) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      if (onDelete) {
        await onDelete(cartItem.id)
      } else {
        // Default behavior - just log and close
        await new Promise((resolve) => setTimeout(resolve, 500))
        console.log(`Deleting cart item: ${cartItem.id}`)
      }
      setOpen(false)
    } catch (error) {
      console.error("Error deleting cart item:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  const itemDescription = cartItem.product_name
    ? `${cartItem.product_name} (Qty: ${cartItem.quantity})`
    : `Cart Item ${cartItem.id}`

  return (
    <>
      <Button
        variant={showText ? "destructive" : "ghost"}
        size={showText ? "default" : "icon"}
        onClick={() => setOpen(true)}
        aria-label={`Delete cart item ${cartItem.id}`}
      >
        <Trash2 className={`h-4 w-4 ${showText ? "mr-2" : ""}`} />
        {showText && "Delete"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Cart Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm text-muted-foreground mt-2">
            <p>
              Are you sure you want to remove{" "}
              <span className="font-semibold text-foreground">{itemDescription}</span> from the cart?
            </p>
            <p>This action cannot be undone.</p>
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
            >
              {isDeleting ? "Deleting..." : "Delete Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
