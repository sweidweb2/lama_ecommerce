"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { ContactPagination } from "./contact-pagination"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TableWrapper } from "@/components/admin/table-wrapper"
import { CreateContactDialog, type AdminContact } from "@/components/admin/contact/create_form"
import { EditContactDialog } from "@/components/admin/contact/edit_form"
import { DeleteContactDialog } from "@/components/admin/contact/delete_dialog"
import { ViewContactDialog } from "@/components/admin/contact/view_dialog"
import { ContactStatusToggle } from "./contact-status-toggle"
import { Download, Eye, X } from "lucide-react"
import { toast } from "sonner"
import { truncateText } from "@/lib/utils"
import type { ContactMessage } from "@/types/user"

const ROWS_PER_PAGE = 20

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

function filterContacts(
  contacts: ContactMessage[],
  name: string,
  email: string,
  from: string,
  to: string,
): ContactMessage[] {
  return contacts.filter((c) => {
    const n = (name || "").trim().toLowerCase()
    const e = (email || "").trim().toLowerCase()
    if (n && !(c.full_name ?? "").toLowerCase().includes(n)) return false
    if (e && !(c.email ?? "").toLowerCase().includes(e)) return false
    if (from) {
      const fromDate = new Date(from)
      fromDate.setHours(0, 0, 0, 0)
      const created = c.created_at ? new Date(c.created_at) : null
      if (!created || created < fromDate) return false
    }
    if (to) {
      const toDate = new Date(to)
      toDate.setHours(23, 59, 59, 999)
      const created = c.created_at ? new Date(c.created_at) : null
      if (!created || created > toDate) return false
    }
    return true
  })
}

interface ContactTableWithFiltersProps {
  contacts: ContactMessage[]
  error: string | null
}

export function ContactTableWithFilters({ contacts, error }: ContactTableWithFiltersProps) {
  const searchParams = useSearchParams()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [page, setPage] = useState(1)
  const [viewingContact, setViewingContact] = useState<ContactMessage | null>(null)

  useEffect(() => {
    const id = searchParams.get("id")
    if (!id) return
    const match = contacts.find((c) => c.id === id)
    if (match) setViewingContact(match)
  }, [contacts, searchParams])

  const filteredContacts = useMemo(
    () => filterContacts(contacts, name, email, from, to),
    [contacts, name, email, from, to],
  )

  const pageCount = Math.max(1, Math.ceil(filteredContacts.length / ROWS_PER_PAGE))
  const currentPage = Math.min(page, pageCount)

  const paginatedContacts = useMemo(() => {
    const start = (currentPage - 1) * ROWS_PER_PAGE
    return filteredContacts.slice(start, start + ROWS_PER_PAGE)
  }, [filteredContacts, currentPage])

  const pageFrom =
    filteredContacts.length === 0 ? 0 : (currentPage - 1) * ROWS_PER_PAGE + 1
  const pageTo = Math.min(currentPage * ROWS_PER_PAGE, filteredContacts.length)

  const handlePageChange = (nextPage: number) => {
    if (nextPage < 1 || nextPage > pageCount) return
    setPage(nextPage)
  }

  const hasActiveFilters =
    name.trim() !== "" || email.trim() !== "" || from !== "" || to !== ""

  const clearFilters = () => {
    setName("")
    setEmail("")
    setFrom("")
    setTo("")
    setPage(1)
  }

  const handleExportToCSV = () => {
    if (filteredContacts.length === 0) {
      toast.error("No contacts to export")
      return
    }

    // Create CSV headers
    const headers = ["Name", "Email", "Phone", "Subject", "Message", "Status", "Date"]
    const csvRows = [headers.join(",")]

    // Add data rows
    filteredContacts.forEach((contact) => {
      const name = `"${(contact.full_name || "").replace(/"/g, '""')}"`
      const email = `"${(contact.email || "").replace(/"/g, '""')}"`
      const phone = `"${(contact.phone || "").replace(/"/g, '""')}"`
      const subject = `"${(contact.subject || "").replace(/"/g, '""')}"`
      const message = `"${(contact.message || "").replace(/"/g, '""').replace(/\n/g, " ")}"`
      const status = `"${contact.status}"`
      const date = contact.created_at
        ? `"${format(new Date(contact.created_at), "PPp")}"`
        : '""'
      csvRows.push([name, email, phone, subject, message, status, date].join(","))
    })

    // Create CSV content
    const csvContent = csvRows.join("\n")

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `contact_messages_${format(new Date(), "yyyy-MM-dd_HH-mm-ss")}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success("Contact messages exported to CSV successfully")
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
            disabled={filteredContacts.length === 0}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export to CSV
          </Button>
          <CreateContactDialog />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4 items-end">
        <div className="space-y-1">
          <Label htmlFor="contact-filter-name">Name</Label>
          <Input
            id="contact-filter-name"
            placeholder="Search name"
            value={name}
            onChange={(e) => {
            setName(e.target.value)
            setPage(1)
          }}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="contact-filter-email">Email</Label>
          <Input
            id="contact-filter-email"
            type="email"
            placeholder="Search email"
            value={email}
            onChange={(e) => {
            setEmail(e.target.value)
            setPage(1)
          }}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="contact-filter-from">From date</Label>
          <Input
            id="contact-filter-from"
            type="date"
            value={from}
            onChange={(e) => {
            setFrom(e.target.value)
            setPage(1)
          }}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="contact-filter-to">To date</Label>
          <Input
            id="contact-filter-to"
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value)
              setPage(1)
            }}
          />
        </div>
        {hasActiveFilters && (
          <div className="md:col-span-4">
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="mr-2 h-4 w-4" />
              Clear filters
            </Button>
          </div>
        )}
      </div>

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
            {paginatedContacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  {contacts.length === 0
                    ? "No contact submissions yet"
                    : "No contacts match the current filters"}
                </TableCell>
              </TableRow>
            ) : (
              paginatedContacts.map((contact) => {
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

      {filteredContacts.length > 0 && (
        <ContactPagination
          currentPage={currentPage}
          pageCount={pageCount}
          totalItems={filteredContacts.length}
          pageFrom={pageFrom}
          pageTo={pageTo}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  )
}
