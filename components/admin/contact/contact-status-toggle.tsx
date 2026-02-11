"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { updateContactStatusAction } from "@/actions/contact_us"
import type { ContactStatus } from "@/types/user"
import { Loader2 } from "lucide-react"

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
      disabled={isPending}
      className="shrink-0"
      aria-label={currentStatus === "new" ? "Mark as read" : "Mark as new"}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <span>{currentStatus === "new" ? "Mark read" : "Mark new"}</span>
      )}
    </Button>
  )
}
