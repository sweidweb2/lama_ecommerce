"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { updateContactStatusAction } from "@/actions/contact_us"
import type { ContactStatus } from "@/types/user"

interface ContactStatusToggleProps {
  contactId: string
  currentStatus: ContactStatus
}

/** Toggles contact message status between "new" and "read". */
export function ContactStatusToggle({ contactId, currentStatus }: ContactStatusToggleProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const isNewOrRead = currentStatus === "new" || currentStatus === "read"
  const nextStatus: ContactStatus = currentStatus === "new" ? "read" : "new"

  const handleToggle = () => {
    if (!isNewOrRead) return
    startTransition(async () => {
      await updateContactStatusAction(contactId, nextStatus)
      router.refresh()
    })
  }

  if (!isNewOrRead) return null

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggle}
      loading={isPending}
      className="shrink-0"
      aria-label={currentStatus === "new" ? "Mark as read" : "Mark as new"}
    >
      {currentStatus === "new" ? "Mark read" : "Mark new"}
    </Button>
  )
}
