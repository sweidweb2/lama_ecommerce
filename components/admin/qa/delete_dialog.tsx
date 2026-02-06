'use client'

import { useState } from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import type { AdminQuestion } from "./create_form"

interface DeleteQuestionDialogProps {
  question: Pick<AdminQuestion, "id" | "product_name" | "question">
  onDelete?: (questionId: string) => void | Promise<void>
  showText?: boolean
}

export function DeleteQuestionDialog({ question, onDelete, showText = false }: DeleteQuestionDialogProps) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      if (onDelete) {
        await onDelete(question.id)
      } else {
        // Default behavior - just log and close
        await new Promise((resolve) => setTimeout(resolve, 500))
        console.log(`Deleting question: ${question.id}`)
      }
      setOpen(false)
    } catch (error) {
      console.error("Error deleting question:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Button
        variant={showText ? "destructive" : "ghost"}
        size={showText ? "default" : "icon"}
        onClick={() => setOpen(true)}
        aria-label={`Delete question ${question.id}`}
      >
        <Trash2 className={`h-4 w-4 ${showText ? "mr-2" : ""}`} />
        {showText && "Delete"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Question</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm text-muted-foreground mt-2">
            <p>
              Are you sure you want to delete the question about{" "}
              <span className="font-semibold text-foreground">{question.product_name}</span>?
            </p>
            <p className="line-clamp-2">
              "{question.question}"
            </p>
            <p>This action cannot be undone.</p>
          </div>
          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Question"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

