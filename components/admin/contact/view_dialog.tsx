'use client'

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"
import type { AdminContact } from "./create_form"

interface ViewContactDialogProps {
  contact: AdminContact
}

export function ViewContactDialog({ contact }: ViewContactDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        aria-label={`View contact from ${contact.full_name || contact.email || contact.id}`}
      >
        <Eye className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Contact Message</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Full Name</p>
                <p className="mt-1 font-medium text-foreground">{contact.full_name || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Email</p>
                <p className="mt-1 text-foreground">{contact.email || "—"}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Phone</p>
                <p className="mt-1 text-foreground">{contact.phone || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Status</p>
                <p className="mt-1 capitalize text-foreground">{contact.status}</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground">Subject</p>
              <p className="mt-1 font-medium text-foreground">{contact.subject || "—"}</p>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground">Message</p>
              <div className="mt-1 rounded-md border bg-muted px-3 py-2 text-sm text-foreground whitespace-pre-wrap">
                {contact.message || "No message provided."}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

