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
import { MessageSquare } from "lucide-react"

// Dummy data
const questions = [
  {
    id: "1",
    question: "What is your return policy?",
    user: "John Doe",
    status: "Answered",
    date: "2024-01-15",
  },
  {
    id: "2",
    question: "How long does shipping take?",
    user: "Jane Smith",
    status: "Pending",
    date: "2024-01-16",
  },
  {
    id: "3",
    question: "Do you ship internationally?",
    user: "Bob Johnson",
    status: "Answered",
    date: "2024-01-16",
  },
  {
    id: "4",
    question: "What payment methods do you accept?",
    user: "Alice Williams",
    status: "Pending",
    date: "2024-01-17",
  },
]

export default function QAPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Q&A</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Manage customer questions and answers
        </p>
      </div>

      <TableWrapper>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Question</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {questions.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.question}</TableCell>
                <TableCell>{item.user}</TableCell>
                <TableCell>
                  <Badge
                    variant={item.status === "Answered" ? "default" : "secondary"}
                  >
                    {item.status}
                  </Badge>
                </TableCell>
                <TableCell>{item.date}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon">
                    <MessageSquare className="h-4 w-4" />
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
