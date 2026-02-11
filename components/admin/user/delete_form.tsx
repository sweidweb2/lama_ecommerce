'use client'

import { useState } from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { deleteProfileAction } from "@/actions/profile"
import type { AdminUser } from "./edit_form"

interface DeleteUserDialogProps {
  user: AdminUser
}

export function DeleteUserDialog({ user }: DeleteUserDialogProps) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirmDelete = async () => {
    setError(null)
    setIsDeleting(true)
    try {
      const result = await deleteProfileAction(user.id)
      if (result?.success) {
        setOpen(false)
      } else {
        setError(result?.error ?? "Delete failed")
      }
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        aria-label={`Delete ${user.name}`}
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete user</DialogTitle>
          </DialogHeader>

          <div className="space-y-2 text-sm text-muted-foreground mt-2">
            <p>
              Are you sure you want to block/soft-delete{" "}
              <span className="font-semibold text-foreground">{user.name}</span>?
            </p>
            <p>
              The user will be marked as blocked (deleted_at set). They will no longer
              appear as active in the admin list.
            </p>
            {error && (
              <p className="text-destructive">{error}</p>
            )}
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
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete user"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

