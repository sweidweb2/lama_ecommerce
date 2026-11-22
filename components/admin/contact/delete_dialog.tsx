'use client'

import { useRouter } from "next/navigation"
import { AdminDeleteDialog } from "@/components/admin/shared/admin-delete-dialog"
import { deleteContactUsAction } from "@/actions/contact_us"
import type { AdminContact } from "./create_form"

interface DeleteContactDialogProps {
  contact: Pick<AdminContact, "id" | "full_name" | "email" | "subject">
  onDelete?: (contactId: string) => void | Promise<void>
  showText?: boolean
}

export function DeleteContactDialog({ contact, onDelete, showText = false }: DeleteContactDialogProps) {
  const router = useRouter()
  const contactLabel = contact.full_name || contact.email || contact.subject || contact.id

  return (
    <AdminDeleteDialog
      title="Delete Contact Message"
      entityLabel="contact"
      ariaLabel={`Delete contact ${contactLabel}`}
      confirmLabel="Delete Message"
      showText={showText}
      toastMessages={{ errorTitle: "Failed to delete contact" }}
      description={
        <>
          <p>
            Are you sure you want to delete the contact message from{" "}
            <span className="font-semibold text-foreground">{contactLabel}</span>?
          </p>
          <p>This action cannot be undone.</p>
        </>
      }
      onConfirm={async () => {
        try {
          if (onDelete) {
            await onDelete(contact.id)
          } else {
            await deleteContactUsAction(contact.id)
          }
        } catch (err) {
          return {
            success: false as const,
            error: err instanceof Error ? err.message : "Failed to delete contact",
          }
        }
        router.refresh()
        return { success: true as const }
      }}
    />
  )
}
