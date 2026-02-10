import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { TableWrapper } from "@/components/admin/table-wrapper"
import { CreateContactDialog, type AdminContact } from "@/components/admin/contact/create_form"
import { EditContactDialog } from "@/components/admin/contact/edit_form"
import { DeleteContactDialog } from "@/components/admin/contact/delete_dialog"
import { ViewContactDialog } from "@/components/admin/contact/view_dialog"
import { getAllContactMessages } from "@/repositories/contact.repository"
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

export default async function ContactPage() {
  let contacts: ContactMessage[] = []
  let error: string | null = null

  try {
    contacts = await getAllContactMessages()
    console.log(contacts)
  } catch (e) {
    console.error("Failed to load contact messages:", e)
    error = "Failed to load contact messages. Make sure you are signed in as an admin."
  }

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
            {contacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No contact submissions yet
                </TableCell>
              </TableRow>
            ) : (
              contacts.map((contact) => (
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
                    <ViewContactDialog contact={contact} />
                    <EditContactDialog contact={contact} />
                    <DeleteContactDialog contact={{
                      id: contact.id,
                      full_name: contact.full_name,
                      email: contact.email,
                      subject: contact.subject,
                    }} />
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
