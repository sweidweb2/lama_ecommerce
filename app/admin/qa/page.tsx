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
import { MessageSquare } from "lucide-react"
import { CreateQuestionDialog, type AdminQuestion } from "@/components/admin/qa/create_form"
import { EditQuestionDialog } from "@/components/admin/qa/edit_form"
import { DeleteQuestionDialog } from "@/components/admin/qa/delete_dialog"
import { ViewQuestionDialog } from "@/components/admin/qa/view_dialog"

// Dummy data matching product_questions + product_answers (flattened)
const questions: AdminQuestion[] = [
  {
    id: "qa-1",
    product_id: "prod-1",
    product_name: "Wireless Headphones",
    user_id: "user-1",
    user_name: "John Doe",
    question: "What is your return policy?",
    answer: "You can return products within 30 days of purchase in original condition.",
    is_approved: true,
    created_at: "2024-01-15T10:30:00Z",
  },
  {
    id: "qa-2",
    product_id: "prod-2",
    product_name: "Smart Watch",
    user_id: "user-2",
    user_name: "Jane Smith",
    question: "How long does shipping take?",
    answer: null,
    is_approved: false,
    created_at: "2024-01-16T09:20:00Z",
  },
  {
    id: "qa-3",
    product_id: "prod-3",
    product_name: "Laptop Stand",
    user_id: "user-3",
    user_name: "Bob Johnson",
    question: "Do you ship internationally?",
    answer: "Yes, we ship to most countries worldwide.",
    is_approved: true,
    created_at: "2024-01-16T14:45:00Z",
  },
  {
    id: "qa-4",
    product_id: "prod-1",
    product_name: "Wireless Headphones",
    user_id: null,
    user_name: null,
    question: "What payment methods do you accept?",
    answer: null,
    is_approved: false,
    created_at: "2024-01-17T11:15:00Z",
  },
]

const getStatusLabel = (approved: boolean, answer: string | null) => {
  if (approved && answer) return "Answered"
  if (!approved && answer) return "Pending Approval"
  return "Pending"
}

const getStatusVariant = (approved: boolean, answer: string | null) => {
  const label = getStatusLabel(approved, answer)
  switch (label) {
    case "Answered":
      return "default"
    case "Pending Approval":
      return "outline"
    case "Pending":
    default:
      return "secondary"
  }
}

export default function QAPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Q&A</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage customer questions and answers
          </p>
        </div>
        <div className="mt-1">
          <CreateQuestionDialog />
        </div>
      </div>

      <TableWrapper>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Question</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {questions.map((item) => {
              const statusLabel = getStatusLabel(item.is_approved, item.answer)
              return (
                <TableRow key={item.id}>
                  <TableCell className="font-medium max-w-md truncate">
                    {item.question}
                  </TableCell>
                  <TableCell>{item.product_name}</TableCell>
                  <TableCell>{item.user_name || "Guest / Anonymous"}</TableCell>
                  <TableCell>
                    <Badge
                      variant={getStatusVariant(item.is_approved, item.answer)}
                      className="capitalize"
                    >
                      {statusLabel}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {item.created_at
                      ? new Date(item.created_at).toLocaleDateString()
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <ViewQuestionDialog question={item} />
                      <EditQuestionDialog question={item} />
                      <DeleteQuestionDialog
                        question={{
                          id: item.id,
                          product_name: item.product_name,
                          question: item.question,
                        }}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableWrapper>
    </div>
  )
}
