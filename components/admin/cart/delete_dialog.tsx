'use client'

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import { hardDeleteCartAction } from "@/actions/cart"

interface DeleteCartDialogProps {
  cart: {
    id: string
    user_id?: string | null
    session_id?: string | null
  }
  onDelete?: (cartId: string) => void | Promise<void>
  showText?: boolean
}

export function DeleteCartDialog({ cart, onDelete, showText = false }: DeleteCartDialogProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      if (onDelete) {
        await onDelete(cart.id)
      } else {
        // Use the hard delete cart action (deletes items first, then cart)
        const result = await hardDeleteCartAction(cart.id)
        
        if (!result.success) {
          toast.error("Error", {
            description: result.error || "Failed to delete cart. Please try again.",
          })
          return
        }

        toast.success("Cart deleted", {
          description: "The cart and all its items have been permanently deleted.",
        })
      }
      setOpen(false)
      
      // If we're on the cart details page, redirect to carts list
      if (pathname?.includes(`/admin/carts/${cart.id}`)) {
        router.push("/admin/carts")
      } else {
        router.refresh()
      }
    } catch (error) {
      console.error("Error deleting cart:", error)
      toast.error("Error", {
        description: "Failed to delete cart. Please try again.",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const cartIdentifier = cart.user_id 
    ? `User ID: ${cart.user_id}` 
    : cart.session_id 
    ? `Session ID: ${cart.session_id}` 
    : cart.id

  return (
    <>
      <Button
        variant={showText ? "destructive" : "ghost"}
        size={showText ? "default" : "icon"}
        onClick={() => setOpen(true)}
        aria-label={`Delete cart ${cart.id}`}
      >
        <Trash2 className={`h-4 w-4 ${showText ? "mr-2" : ""}`} />
        {showText && "Delete"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Cart</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm text-muted-foreground mt-2">
            <p>
              Are you sure you want to delete the cart{" "}
              <span className="font-semibold text-foreground">{cartIdentifier}</span>?
            </p>
            <p>This action cannot be undone. All associated cart items will be permanently removed.</p>
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
              loading={isDeleting}
            >
              Delete Cart
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
