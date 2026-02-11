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
import { Button } from "@/components/ui/button"
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

export default async function ContactPage({
  searchParams,
}: {
  searchParams: {
    name?: string
    email?: string
    from?: string
    to?: string
  }
}) {
  const name = searchParams?.name ?? ""
  const email = searchParams?.email ?? ""
  const from = searchParams?.from ?? ""
  const to = searchParams?.to ?? ""

  let contacts: ContactMessage[] = []
  let error: string | null = null

  try {
    contacts = await getAllContactMessages({
      name: name || undefined,
      email: email || undefined,
      from: from ? `${from}T00:00:00.000Z` : undefined,
      to: to ? `${to}T23:59:59.999Z` : undefined,
    })
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

      <form className="grid gap-4 md:grid-cols-4 items-end" method="get">
        <div className="space-y-1">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            placeholder="Search name"
            defaultValue={name}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="Search email"
            defaultValue={email}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="from">From date</Label>
          <Input
            id="from"
            name="from"
            type="date"
            defaultValue={from}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="to">To date</Label>
          <Input
            id="to"
            name="to"
            type="date"
            defaultValue={to}
          />
        </div>
        <div className="md:col-span-4 flex gap-2">
          <Button type="submit">Apply filters</Button>
        </div>
      </form>

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
