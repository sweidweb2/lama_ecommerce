'use client'

import { useState } from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

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
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      if (onDelete) {
        await onDelete(cart.id)
      } else {
        // Default behavior - just log and close
        await new Promise((resolve) => setTimeout(resolve, 500))
        console.log(`Deleting cart: ${cart.id}`)
      }
      setOpen(false)
    } catch (error) {
      console.error("Error deleting cart:", error)
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
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Cart"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
