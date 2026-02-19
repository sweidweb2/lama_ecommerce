'use client'

import { useState } from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { deleteOrderAction } from "@/actions/order"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type { AdminOrder } from "./edit_form"

interface DeleteOrderDialogProps {
  order: {
    id: string
    status?: string
    total?: number | null
    deleted_at?: string | null
  }
  onDelete?: (orderId: string) => void | Promise<void>
  showText?: boolean
  redirectAfterDelete?: boolean
}

export function DeleteOrderDialog({ order, onDelete, showText = false, redirectAfterDelete = false }: DeleteOrderDialogProps) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const isAlreadyDeleted = !!order.deleted_at

  const handleDelete = async () => {
    if (isAlreadyDeleted) {
      toast.error("This order is already deleted")
      return
    }
    setIsDeleting(true)
    try {
      if (onDelete) {
        // Use custom onDelete handler if provided
        await onDelete(order.id)
      } else {
        // Default behavior - use server action
        const result = await deleteOrderAction(order.id)
        
        if (result.success) {
          toast.success("Order deleted successfully")
          setOpen(false)
          
          // Redirect to orders list if specified, otherwise just refresh
          if (redirectAfterDelete) {
            router.push("/admin/orders")
          } else {
            router.refresh()
          }
        } else {
          toast.error(result.error || "Failed to delete order")
        }
      }
    } catch (error) {
      console.error("Error deleting order:", error)
      toast.error("An unexpected error occurred while deleting the order")
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
        disabled={isAlreadyDeleted}
        aria-label={`Delete order ${order.id}`}
        title={isAlreadyDeleted ? "Order is already deleted" : "Delete order"}
      >
        <Trash2 className={`h-4 w-4 ${showText ? "mr-2" : ""}`} />
        {showText && "Delete"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm text-muted-foreground mt-2">
            <p>
              Are you sure you want to delete order{" "}
              <span className="font-semibold text-foreground">{order.id.slice(0, 8)}...</span>?
            </p>
            <p>This will soft-delete the order and all its order items. The order will be hidden from the list unless you check "Show deleted orders".</p>
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
              {isDeleting ? "Deleting..." : "Delete Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
