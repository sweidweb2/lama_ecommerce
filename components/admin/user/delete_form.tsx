'use client'

import { useState } from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import type { AdminUser } from "./edit_form"

interface DeleteUserDialogProps {
  user: AdminUser
}

/** Delete user dialog. Profile delete is disabled; use Active/Inactive status instead. */
export function DeleteUserDialog({ user }: DeleteUserDialogProps) {
  const [open, setOpen] = useState(false)

  const handleConfirmDelete = () => {
    setOpen(false)
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
              User <span className="font-semibold text-foreground">{user.name}</span>.
            </p>
            <p>Profile delete is disabled. Set status to Inactive instead.</p>
          </div>

          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

