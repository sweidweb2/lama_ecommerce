'use client'

import { useState } from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { deleteOrderAction } from "@/actions/order"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface DeleteOrderDialogProps {
  order: {
    id: string
    status?: string
    total?: number | null
  }
  onDelete?: (orderId: string) => void | Promise<void>
  showText?: boolean
  redirectAfterDelete?: boolean
  disabled?: boolean
}

export function DeleteOrderDialog({ order, onDelete, showText = false, redirectAfterDelete = false, disabled = false }: DeleteOrderDialogProps) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      if (onDelete) {
        await onDelete(order.id)
      } else {
        const result = await deleteOrderAction(order.id)
        
        if (result.success) {
          toast.success("Order deleted successfully")
          setOpen(false)
          
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
        disabled={disabled}
        aria-label={`Delete order ${order.id}`}
        title={disabled ? "Delete order is disabled" : "Delete order"}
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
            <p>
              This permanently deletes the order and its line items. Orders with
              payments or shipments cannot be deleted.
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
