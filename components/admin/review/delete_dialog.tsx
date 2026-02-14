'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import { deleteReviewAction } from "@/actions/review"
import type { AdminReview } from "./create_form"

interface DeleteReviewDialogProps {
  review: Pick<AdminReview, "id" | "product_name" | "user_name" | "rating">
  onDelete?: (reviewId: string) => void | Promise<void>
  showText?: boolean
}

export function DeleteReviewDialog({ review, onDelete, showText = false }: DeleteReviewDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    setError(null)
    setIsDeleting(true)
    try {
      // Use custom onDelete callback if provided, otherwise use the action
      if (onDelete) {
        await onDelete(review.id)
      } else {
        const result = await deleteReviewAction(review.id)
        if (!result.success) {
          setError(result.error || "Failed to delete review")
          toast.error("Error", {
            description: result.error || "Failed to delete review",
          })
          return
        }
        toast.success("Review deleted", {
          description: "The review has been successfully deleted.",
        })
      }
      setOpen(false)
      router.refresh()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete review"
      setError(errorMessage)
      toast.error("Error", {
        description: errorMessage,
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const reviewLabel = `${review.product_name} - ${review.user_name || "Guest"} (${review.rating}/5)`

  return (
    <>
      <Button
        variant={showText ? "destructive" : "ghost"}
        size={showText ? "default" : "icon"}
        onClick={() => setOpen(true)}
        aria-label={`Delete review ${review.id}`}
      >
        <Trash2 className={`h-4 w-4 ${showText ? "mr-2" : ""}`} />
        {showText && "Delete"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Review</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm text-muted-foreground mt-2">
            <p>
              Are you sure you want to delete the review{" "}
              <span className="font-semibold text-foreground">{reviewLabel}</span>?
            </p>
            <p>This action cannot be undone.</p>
          </div>
          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive mt-4">
              {error}
            </div>
          )}
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
              {isDeleting ? "Deleting..." : "Delete Review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

