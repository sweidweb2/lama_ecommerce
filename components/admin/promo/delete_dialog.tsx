'use client'

import { useState } from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import type { AdminPromoCode } from "./create_form"

interface DeletePromoCodeDialogProps {
  promoCode: Pick<AdminPromoCode, "id" | "code">
  onDelete?: (promoCodeId: string) => void | Promise<void>
  showText?: boolean
}

export function DeletePromoCodeDialog({ promoCode, onDelete, showText = false }: DeletePromoCodeDialogProps) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      if (onDelete) {
        await onDelete(promoCode.id)
      } else {
        // Default behavior - call API
        const response = await fetch(`/api/admin/promo-codes/${promoCode.id}`, {
          method: "DELETE",
        })

        if (!response.ok) {
          throw new Error("Failed to delete promo code")
        }
      }
      setOpen(false)
    } catch (error) {
      console.error("Error deleting promo code:", error)
      // TODO: Show error toast
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
        aria-label={`Delete promo code ${promoCode.code}`}
      >
        <Trash2 className={`h-4 w-4 ${showText ? "mr-2" : ""}`} />
        {showText && "Delete"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Promo Code</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm text-muted-foreground mt-2">
            <p>
              Are you sure you want to delete the promo code{" "}
              <span className="font-semibold text-foreground">{promoCode.code}</span>?
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
              {isDeleting ? "Deleting..." : "Delete Promo Code"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
