'use client'

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { MessageSquare } from "lucide-react"
import type { AdminQuestion } from "./create_form"

interface ViewQuestionDialogProps {
  question: AdminQuestion
}

export function ViewQuestionDialog({ question }: ViewQuestionDialogProps) {
  const [open, setOpen] = useState(false)
  const [answer, setAnswer] = useState<string>(question.answer || "")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const hasAnswer = Boolean(question.answer)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!answer.trim()) return

    setIsSubmitting(true)
    try {
      const payload = {
        question_id: question.id,
        answer: answer.trim(),
      }
      // TODO: Wire this up to a real admin answer action / API
      console.log("Submitting answer:", payload)
    } catch (error) {
      console.error("Error submitting answer:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        aria-label={`View question ${question.id}`}
      >
        <MessageSquare className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Question & Answer</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Product</p>
                <p className="mt-1 font-medium text-foreground">{question.product_name}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">User</p>
                <p className="mt-1 text-foreground">
                  {question.user_name || "Guest / Anonymous"}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground">Question</p>
              <div className="mt-1 rounded-md border bg-muted px-3 py-2 text-sm text-foreground whitespace-pre-wrap">
                {question.question}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Answer</p>
              {hasAnswer ? (
                <div className="mt-1 rounded-md border bg-muted px-3 py-2 text-sm text-foreground whitespace-pre-wrap">
                  {question.answer}
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <Textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Write an answer to this question..."
                    rows={4}
                  />
                  <div className="flex justify-end">
                    <Button type="submit" disabled={isSubmitting || !answer.trim()}>
                      {isSubmitting ? "Submitting..." : "Submit Answer"}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}


