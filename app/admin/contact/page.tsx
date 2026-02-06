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

// Dummy data matching the contact_us schema
const contacts: AdminContact[] = [
  {
    id: "contact-1",
    full_name: "John Doe",
    email: "john.doe@example.com",
    phone: "+1234567890",
    subject: "Product Inquiry",
    message: "I'm interested in your products, can you provide more details about bulk pricing and shipping options?",
    status: "new",
    created_at: "2024-01-15T10:30:00Z",
  },
  {
    id: "contact-2",
    full_name: "Jane Smith",
    email: "jane.smith@example.com",
    phone: "+1234567891",
    subject: "Support Request",
    message: "I need help with my recent order. The tracking number does not seem to be working.",
    status: "read",
    created_at: "2024-01-16T09:20:00Z",
  },
  {
    id: "contact-3",
    full_name: "Bob Johnson",
    email: "bob.johnson@example.com",
    phone: null,
    subject: "Partnership Inquiry",
    message: "I'd like to discuss a potential partnership opportunity with your company.",
    status: "replied",
    created_at: "2024-01-16T14:45:00Z",
  },
]

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

export default function ContactPage() {
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
            {contacts.map((contact) => (
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
            ))}
          </TableBody>
        </Table>
      </TableWrapper>
    </div>
  )
}
