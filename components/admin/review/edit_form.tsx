'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
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
import { toast } from "sonner"
import { updateReviewAction } from "@/actions/review"
import type { AdminReview } from "./create_form"

const REVIEW_STATUSES: AdminReview["review_status"][] = ["pending", "approved", "rejected"]

interface EditReviewDialogProps {
  review: AdminReview
  showText?: boolean
}

export function EditReviewDialog({ review, showText = false }: EditReviewDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState<string>(review.rating.toString())
  const [title, setTitle] = useState<string>(review.title || "")
  const [comment, setComment] = useState<string>(review.comment || "")
  const [status, setStatus] = useState<AdminReview["review_status"]>(review.review_status)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const result = await updateReviewAction(review.id, {
        rating: Math.min(5, Math.max(1, parseInt(rating) || 1)),
        title: title.trim() || null,
        comment: comment.trim() || null,
        review_status: status,
      })

      if (!result.success) {
        setError(result.error || "Failed to update review")
        toast.error("Error", {
          description: result.error || "Failed to update review",
        })
        return
      }

      toast.success("Review updated", {
        description: "The review has been successfully updated.",
      })

      setOpen(false)
      router.refresh()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update review"
      setError(errorMessage)
      toast.error("Error", {
        description: errorMessage,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setRating(review.rating.toString())
    setTitle(review.title || "")
    setComment(review.comment || "")
    setStatus(review.review_status)
    setError(null)
    setOpen(false)
  }

  return (
    <>
      <Button
        variant={showText ? "outline" : "ghost"}
        size={showText ? "default" : "icon"}
        onClick={() => setOpen(true)}
        aria-label={`Edit review ${review.id}`}
      >
        <Edit className={`h-4 w-4 ${showText ? "mr-2" : ""}`} />
        {showText && "Edit"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Review</DialogTitle>
          </DialogHeader>

          <form className="space-y-4 mt-2" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Product</Label>
                <p className="text-sm font-medium text-foreground">
                  {review.product_name}
                </p>
              </div>
              <div className="space-y-2">
                <Label>User</Label>
                <p className="text-sm text-foreground">
                  {review.user_name || "Guest / Anonymous"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`review-rating-${review.id}`}>
                  Rating <span className="text-destructive">*</span>
                </Label>
                <Input
                  id={`review-rating-${review.id}`}
                  type="number"
                  min={1}
                  max={5}
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`review-status-${review.id}`}>Status</Label>
                <Select
                  value={status}
                  onValueChange={(value) =>
                    setStatus(value as AdminReview["review_status"])
                  }
                >
                  <SelectTrigger id={`review-status-${review.id}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REVIEW_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`review-title-${review.id}`}>Title</Label>
              <Input
                id={`review-title-${review.id}`}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Short summary of the review"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`review-comment-${review.id}`}>Comment</Label>
              <Textarea
                id={`review-comment-${review.id}`}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write the review comment here..."
                rows={4}
              />
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <DialogFooter className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

