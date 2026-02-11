'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { deleteContactUsAction } from "@/actions/contact_us"
import type { AdminContact } from "./create_form"

interface DeleteContactDialogProps {
  contact: Pick<AdminContact, "id" | "full_name" | "email" | "subject">
  onDelete?: (contactId: string) => void | Promise<void>
  showText?: boolean
}

export function DeleteContactDialog({ contact, onDelete, showText = false }: DeleteContactDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    setError(null)
    setIsDeleting(true)
    try {
      if (onDelete) {
        await onDelete(contact.id)
      } else {
        await deleteContactUsAction(contact.id)
      }
      setOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete contact")
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
            {error && (
              <p className="text-destructive rounded-md bg-destructive/10 px-3 py-2">
                {error}
              </p>
            )}
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

