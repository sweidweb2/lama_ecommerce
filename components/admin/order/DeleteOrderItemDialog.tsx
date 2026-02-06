'use client'

import { useState } from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import type { OrderItem } from "@/types/order"

interface DeleteOrderItemDialogProps {
  orderItem: OrderItem
  onDelete?: (orderItemId: string) => void | Promise<void>
  showText?: boolean
}

export function DeleteOrderItemDialog({ orderItem, onDelete, showText = false }: DeleteOrderItemDialogProps) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      if (onDelete) {
        await onDelete(orderItem.id)
      } else {
        // Default behavior - just log and close
        await new Promise((resolve) => setTimeout(resolve, 500))
        console.log(`Deleting order item: ${orderItem.id}`)
      }
      setOpen(false)
    } catch (error) {
      console.error("Error deleting order item:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  const itemDescription = orderItem.product_name_snapshot
    ? `${orderItem.product_name_snapshot} (Qty: ${orderItem.quantity})`
    : `Order Item ${orderItem.id.slice(0, 8)}...`

  return (
    <>
      <Button
        variant={showText ? "destructive" : "ghost"}
        size={showText ? "default" : "icon"}
        onClick={() => setOpen(true)}
        aria-label={`Delete order item ${orderItem.id}`}
      >
        <Trash2 className={`h-4 w-4 ${showText ? "mr-2" : ""}`} />
        {showText && "Delete"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Order Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm text-muted-foreground mt-2">
            <p>
              Are you sure you want to remove{" "}
              <span className="font-semibold text-foreground">{itemDescription}</span> from the order?
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
