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
import { Mail, Eye } from "lucide-react"

// Dummy data
const messages = [
  {
    id: "1",
    name: "John Doe",
    email: "john.doe@example.com",
    subject: "Product Inquiry",
    message: "I'm interested in your products...",
    status: "Unread",
    date: "2024-01-15",
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane.smith@example.com",
    subject: "Support Request",
    message: "I need help with my order...",
    status: "Read",
    date: "2024-01-16",
  },
  {
    id: "3",
    name: "Bob Johnson",
    email: "bob.johnson@example.com",
    subject: "Partnership Inquiry",
    message: "I'd like to discuss a partnership...",
    status: "Unread",
    date: "2024-01-16",
  },
]

export default function ContactPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Contact Us</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Manage contact form submissions
        </p>
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
            {messages.map((message) => (
              <TableRow key={message.id}>
                <TableCell className="font-medium">{message.name}</TableCell>
                <TableCell>{message.email}</TableCell>
                <TableCell>{message.subject}</TableCell>
                <TableCell>
                  <Badge
                    variant={message.status === "Read" ? "default" : "secondary"}
                  >
                    {message.status}
                  </Badge>
                </TableCell>
                <TableCell>{message.date}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon">
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableWrapper>
    </div>
  )
}
