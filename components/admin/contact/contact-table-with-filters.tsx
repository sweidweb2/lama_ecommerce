"use client"

import { useMemo, useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TableWrapper } from "@/components/admin/table-wrapper"
import { CreateContactDialog, type AdminContact } from "@/components/admin/contact/create_form"
import { EditContactDialog } from "@/components/admin/contact/edit_form"
import { DeleteContactDialog } from "@/components/admin/contact/delete_dialog"
import { ViewContactDialog } from "@/components/admin/contact/view_dialog"
import type { ContactMessage } from "@/types/user"

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
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")

  const filteredContacts = useMemo(
    () => filterContacts(contacts, name, email, from, to),
    [contacts, name, email, from, to],
  )

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Contact Us</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage contact form submissions
          </p>
        </div>
        <div className="mt-1">
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
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="contact-filter-email">Email</Label>
          <Input
            id="contact-filter-email"
            type="email"
            placeholder="Search email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="contact-filter-from">From date</Label>
          <Input
            id="contact-filter-from"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="contact-filter-to">To date</Label>
          <Input
            id="contact-filter-to"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
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
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredContacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  {contacts.length === 0
                    ? "No contact submissions yet"
                    : "No contacts match the current filters"}
                </TableCell>
              </TableRow>
            ) : (
              filteredContacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell className="font-medium">{contact.full_name || "—"}</TableCell>
                  <TableCell>{contact.email || "—"}</TableCell>
                  <TableCell>{contact.subject || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(contact.status)} className="capitalize">
                      {contact.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {contact.created_at
                      ? new Date(contact.created_at).toLocaleDateString()
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <ViewContactDialog contact={contact as AdminContact} />
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
              ))
            )}
          </TableBody>
        </Table>
      </TableWrapper>
    </div>
  )
}
