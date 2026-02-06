'use client'

import { useState } from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import type { AdminContact } from "./create_form"

interface DeleteContactDialogProps {
  contact: Pick<AdminContact, "id" | "full_name" | "email" | "subject">
  onDelete?: (contactId: string) => void | Promise<void>
  showText?: boolean
}

export function DeleteContactDialog({ contact, onDelete, showText = false }: DeleteContactDialogProps) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      if (onDelete) {
        await onDelete(contact.id)
      } else {
        // Default behavior - just log and close
        await new Promise((resolve) => setTimeout(resolve, 500))
        console.log(`Deleting contact: ${contact.id}`)
      }
      setOpen(false)
    } catch (error) {
      console.error("Error deleting contact:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  const contactLabel = contact.full_name || contact.email || contact.subject || contact.id

  return (
    <>
      <Button
        variant={showText ? "destructive" : "ghost"}
        size={showText ? "default" : "icon"}
        onClick={() => setOpen(true)}
        aria-label={`Delete contact ${contactLabel}`}
      >
        <Trash2 className={`h-4 w-4 ${showText ? "mr-2" : ""}`} />
        {showText && "Delete"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Contact Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm text-muted-foreground mt-2">
            <p>
              Are you sure you want to delete the contact message from{" "}
              <span className="font-semibold text-foreground">{contactLabel}</span>?
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
              {isDeleting ? "Deleting..." : "Delete Message"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

