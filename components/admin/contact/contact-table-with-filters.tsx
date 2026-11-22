"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AdminPagination } from "@/components/admin/shared/AdminPagination"
import { ContactFilters } from "./contact-filters"
import { format } from "date-fns"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TableWrapper } from "@/components/admin/table-wrapper"
import { CreateContactDialog, type AdminContact } from "@/components/admin/contact/create_form"
import { EditContactDialog } from "@/components/admin/contact/edit_form"
import { DeleteContactDialog } from "@/components/admin/contact/delete_dialog"
import { ViewContactDialog } from "@/components/admin/contact/view_dialog"
import { ContactStatusToggle } from "./contact-status-toggle"
import { Download, Eye } from "lucide-react"
import { toast } from "sonner"
import { truncateText } from "@/lib/utils"
import type { ContactMessage } from "@/types/user"
import { exportContactsAction } from "@/actions/contact_us"
import { ADMIN_CONTACTS_PAGE_SIZE } from "@/lib/admin/contacts-list-params"

const MAX_CHARS = {
  name: 24,
  email: 28,
  subject: 36,
} as const

const getStatusVariant = (status: AdminContact["status"]) => {
  switch (status) {
    case "new":
      return "secondary"
    case "read":
      return "default"
    case "replied":
      return "outline"
    case "resolved":
      return "default"
    default:
      return "secondary"
  }
}

interface ContactTableWithFiltersProps {
  contacts: ContactMessage[]
  totalCount: number
  page: number
  pageSize?: number
  error: string | null
  initialName: string
  initialEmail: string
  initialFrom: string
  initialTo: string
}

export function ContactTableWithFilters({
  contacts,
  totalCount,
  page,
  pageSize = ADMIN_CONTACTS_PAGE_SIZE,
  error,
  initialName,
  initialEmail,
  initialFrom,
  initialTo,
}: ContactTableWithFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isExporting, setIsExporting] = useState(false)
  const [viewingContact, setViewingContact] = useState<ContactMessage | null>(
    null,
  )

  useEffect(() => {
    const id = searchParams.get("id")
    if (!id) return
    const match = contacts.find((c) => c.id === id)
    if (match) setViewingContact(match)
  }, [contacts, searchParams])

  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize) || 1)
  const pageFrom = contacts.length === 0 ? 0 : (page - 1) * pageSize + 1
  const pageTo = (page - 1) * pageSize + contacts.length

  const handlePageChange = (nextPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    if (nextPage <= 1) params.delete("page")
    else params.set("page", String(nextPage))
    const query = params.toString()
    router.push(query ? `/admin/contact?${query}` : "/admin/contact")
  }

  const hasActiveFilters =
    initialName.trim() !== "" ||
    initialEmail.trim() !== "" ||
    initialFrom !== "" ||
    initialTo !== ""

  const handleExportToCSV = async () => {
    setIsExporting(true)
    try {
      const rows = await exportContactsAction({
        name: initialName.trim() || undefined,
        email: initialEmail.trim() || undefined,
        from: initialFrom || undefined,
        to: initialTo || undefined,
      })

      if (rows.length === 0) {
        toast.error("No contacts to export")
        return
      }

      const headers = [
        "Name",
        "Email",
        "Phone",
        "Subject",
        "Message",
        "Status",
        "Date",
      ]
      const csvRows = [headers.join(",")]

      rows.forEach((contact) => {
        const name = `"${(contact.full_name || "").replace(/"/g, '""')}"`
        const email = `"${(contact.email || "").replace(/"/g, '""')}"`
        const phone = `"${(contact.phone || "").replace(/"/g, '""')}"`
        const subject = `"${(contact.subject || "").replace(/"/g, '""')}"`
        const message = `"${(contact.message || "")
          .replace(/"/g, '""')
          .replace(/\n/g, " ")}"`
        const status = `"${contact.status}"`
        const date = contact.created_at
          ? `"${format(new Date(contact.created_at), "PPp")}"`
          : '""'
        csvRows.push(
          [name, email, phone, subject, message, status, date].join(","),
        )
      })

      const csvContent = csvRows.join("\n")
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute(
        "download",
        `contact_messages_${format(new Date(), "yyyy-MM-dd_HH-mm-ss")}.csv`,
      )
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success("Contact messages exported to CSV successfully")
    } catch {
      toast.error("Failed to export contacts")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {viewingContact && (
        <ViewContactDialog
          contact={viewingContact as AdminContact}
          open={true}
          showTrigger={false}
          onOpenChange={(next) => {
            if (!next) setViewingContact(null)
          }}
        />
      )}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Contact Us</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage contact form submissions
          </p>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleExportToCSV}
            disabled={totalCount === 0 || isExporting}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {isExporting ? "Exporting…" : "Export to CSV"}
          </Button>
          <CreateContactDialog />
        </div>
      </div>

      <ContactFilters />

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <TableWrapper>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[15%]">Name</TableHead>
              <TableHead className="w-[18%]">Email</TableHead>
              <TableHead className="w-[20%]">Subject</TableHead>
              <TableHead className="w-[15%]">Status</TableHead>
              <TableHead className="w-[15%]">Date</TableHead>
              <TableHead className="w-[17%] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground py-8"
                >
                  {hasActiveFilters
                    ? "No contacts match the current filters"
                    : "No contact submissions yet"}
                </TableCell>
              </TableRow>
            ) : (
              contacts.map((contact) => {
                const nameLabel = contact.full_name || "—"
                const emailLabel = contact.email || "—"
                const subjectLabel = contact.subject || "—"

                return (
                  <TableRow
                    key={contact.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setViewingContact(contact)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        setViewingContact(contact)
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`View contact from ${nameLabel}`}
                  >
                    <TableCell className="font-medium w-[15%]">
                      <div className="truncate" title={nameLabel}>
                        {truncateText(nameLabel, MAX_CHARS.name)}
                      </div>
                    </TableCell>
                    <TableCell className="w-[18%]">
                      <div className="truncate" title={emailLabel}>
                        {truncateText(emailLabel, MAX_CHARS.email)}
                      </div>
                    </TableCell>
                    <TableCell className="w-[20%]">
                      <div className="truncate" title={subjectLabel}>
                        {truncateText(subjectLabel, MAX_CHARS.subject)}
                      </div>
                    </TableCell>
                    <TableCell
                      className="w-[15%]"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={getStatusVariant(contact.status)}
                          className="capitalize"
                        >
                          {contact.status}
                        </Badge>
                        <ContactStatusToggle
                          contactId={contact.id}
                          currentStatus={contact.status}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="w-[15%]">
                      {contact.created_at
                        ? format(new Date(contact.created_at), "MMM d, yyyy")
                        : "—"}
                    </TableCell>
                    <TableCell
                      className="w-[17%] text-right"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setViewingContact(contact)}
                          aria-label={`View contact from ${contact.full_name || contact.email || contact.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <EditContactDialog contact={contact as AdminContact} />
                        <DeleteContactDialog
                          contact={{
                            id: contact.id,
                            full_name: contact.full_name,
                            email: contact.email,
                            subject: contact.subject,
                          }}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </TableWrapper>

      {totalCount > 0 && (
        <AdminPagination
          itemLabel="messages"
          currentPage={page}
          pageCount={pageCount}
          totalItems={totalCount}
          pageFrom={pageFrom}
          pageTo={pageTo}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  )
}
