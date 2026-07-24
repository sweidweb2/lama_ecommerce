'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Edit } from "lucide-react"
import { updateContactUsAction, updateContactStatusAction } from "@/actions/contact_us"
import { CONTACT_US_FIELD_MAX } from "@/lib/validators/contact_us/create"
import type { AdminContact } from "./create_form"

const CONTACT_STATUSES = ['new', 'read', 'replied', 'resolved'] as const

interface EditContactDialogProps {
  contact: AdminContact
}

export function EditContactDialog({ contact }: EditContactDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [fullName, setFullName] = useState(contact.full_name || "")
  const [email, setEmail] = useState(contact.email || "")
  const [phone, setPhone] = useState(contact.phone || "")
  const [subject, setSubject] = useState(contact.subject || "")
  const [message, setMessage] = useState(contact.message || "")
  const [status, setStatus] = useState<AdminContact["status"]>(contact.status)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resetFields = () => {
    setFullName(contact.full_name || "")
    setEmail(contact.email || "")
    setPhone(contact.phone || "")
    setSubject(contact.subject || "")
    setMessage(contact.message || "")
    setStatus(contact.status)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      const result = await updateContactUsAction(contact.id, {
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        subject: subject.trim(),
        message: message.trim(),
      })
      if (!result.success) {
        setError(result.error || "Failed to update contact")
        return
      }
      if (status !== contact.status) {
        await updateContactStatusAction(contact.id, status)
      }
      setOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update contact")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    resetFields()
    setOpen(false)
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          resetFields()
          setOpen(true)
        }}
        aria-label={`Edit contact from ${contact.full_name || contact.email || contact.id}`}
      >
        <Edit className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={(next) => {
        if (!next) resetFields()
        setOpen(next)
      }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Contact Message</DialogTitle>
          </DialogHeader>

          <form className="space-y-4 mt-2" onSubmit={handleSubmit}>
            {error && (
              <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">
                {error}
              </p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`contact-full-name-${contact.id}`}>
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id={`contact-full-name-${contact.id}`}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  maxLength={CONTACT_US_FIELD_MAX.full_name}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`contact-email-${contact.id}`}>
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id={`contact-email-${contact.id}`}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john.doe@example.com"
                  maxLength={CONTACT_US_FIELD_MAX.email}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`contact-phone-${contact.id}`}>Phone</Label>
                <Input
                  id={`contact-phone-${contact.id}`}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1234567890"
                  maxLength={CONTACT_US_FIELD_MAX.phone}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`contact-subject-${contact.id}`}>
                  Subject <span className="text-destructive">*</span>
                </Label>
                <Input
                  id={`contact-subject-${contact.id}`}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Subject"
                  maxLength={CONTACT_US_FIELD_MAX.subject}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`contact-message-${contact.id}`}>
                Message <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id={`contact-message-${contact.id}`}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write the contact message here..."
                rows={5}
                maxLength={CONTACT_US_FIELD_MAX.message}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`contact-status-${contact.id}`}>Status</Label>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as AdminContact["status"])}
              >
                <SelectTrigger id={`contact-status-${contact.id}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTACT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" loading={isSubmitting}>
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
