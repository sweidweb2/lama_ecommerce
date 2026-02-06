'use client'

import { useState } from "react"
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
import type { AdminQuestion } from "./create_form"

const APPROVAL_OPTIONS = [
  { value: "false", label: "Pending" },
  { value: "true", label: "Approved" },
]

interface EditQuestionDialogProps {
  question: AdminQuestion
  showText?: boolean
}

export function EditQuestionDialog({ question, showText = false }: EditQuestionDialogProps) {
  const [open, setOpen] = useState(false)
  const [questionText, setQuestionText] = useState<string>(question.question)
  const [answerText, setAnswerText] = useState<string>(question.answer || "")
  const [isApproved, setIsApproved] = useState<string>(question.is_approved ? "true" : "false")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const updatedQuestion = {
      id: question.id,
      question: questionText.trim(),
      answer: answerText.trim() || null,
      is_approved: isApproved === "true",
    }

    // TODO: Wire this up to a real admin update action / API
    console.log("Updating question:", updatedQuestion)

    setOpen(false)
  }

  const handleCancel = () => {
    setQuestionText(question.question)
    setAnswerText(question.answer || "")
    setIsApproved(question.is_approved ? "true" : "false")
    setOpen(false)
  }

  return (
    <>
      <Button
        variant={showText ? "outline" : "ghost"}
        size={showText ? "default" : "icon"}
        onClick={() => setOpen(true)}
        aria-label={`Edit question ${question.id}`}
      >
        <Edit className={`h-4 w-4 ${showText ? "mr-2" : ""}`} />
        {showText && "Edit"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Question & Answer</DialogTitle>
          </DialogHeader>

          <form className="space-y-4 mt-2" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Product</Label>
                <p className="text-sm font-medium text-foreground">
                  {question.product_name}
                </p>
              </div>
              <div className="space-y-2">
                <Label>User</Label>
                <p className="text-sm text-foreground">
                  {question.user_name || "Guest / Anonymous"}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`qa-question-${question.id}`}>
                Question <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id={`qa-question-${question.id}`}
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`qa-answer-${question.id}`}>Answer</Label>
              <Textarea
                id={`qa-answer-${question.id}`}
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`qa-approved-${question.id}`}>Approved</Label>
              <Select
                value={isApproved}
                onValueChange={setIsApproved}
              >
                <SelectTrigger id={`qa-approved-${question.id}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {APPROVAL_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
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
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!questionText.trim()}>
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

