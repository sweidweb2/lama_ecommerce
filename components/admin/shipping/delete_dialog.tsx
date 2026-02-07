'use client'

import { useState } from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import type { AdminShippingZone } from "./create_form"

interface DeleteShippingZoneDialogProps {
  zone: Pick<AdminShippingZone, "id" | "name">
  onDelete?: (zoneId: string) => void | Promise<void>
  showText?: boolean
}

export function DeleteShippingZoneDialog({ zone, onDelete, showText = false }: DeleteShippingZoneDialogProps) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      if (onDelete) {
        await onDelete(zone.id)
      } else {
        // Default behavior - call API
        const response = await fetch(`/api/admin/shipping-zones/${zone.id}`, {
          method: "DELETE",
        })

        if (!response.ok) {
          throw new Error("Failed to delete shipping zone")
        }
      }
      setOpen(false)
    } catch (error) {
      console.error("Error deleting shipping zone:", error)
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
        aria-label={`Delete shipping zone ${zone.name}`}
      >
        <Trash2 className={`h-4 w-4 ${showText ? "mr-2" : ""}`} />
        {showText && "Delete"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Shipping Zone</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm text-muted-foreground mt-2">
            <p>
              Are you sure you want to delete the shipping zone{" "}
              <span className="font-semibold text-foreground">{zone.name}</span>?
            </p>
            <p>This will also delete the associated shipping fee. This action cannot be undone.</p>
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
              {isDeleting ? "Deleting..." : "Delete Zone"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
