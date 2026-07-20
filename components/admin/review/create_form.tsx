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
import { Plus } from "lucide-react"
import { createReviewAdminAction } from "@/actions/review"

export type AdminReview = {
  id: string
  product_id: string
  product_name: string
  user_id: string | null
  user_name: string | null
  rating: number
  title: string | null
  comment: string | null
  review_status: "pending" | "approved" | "rejected"
  created_at?: string
}

export interface ProductOption {
  id: string
  name: string
}

export interface ProfileOption {
  id: string
  name: string
}

interface CreateReviewDialogProps {
  products: ProductOption[]
  profiles: ProfileOption[]
}

const REVIEW_STATUSES: AdminReview["review_status"][] = ["pending", "approved", "rejected"]

const NONE_VALUE = "__none__"

export function CreateReviewDialog({ products, profiles }: CreateReviewDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [productId, setProductId] = useState<string>("")
  const [userId, setUserId] = useState<string>(NONE_VALUE)
  const [rating, setRating] = useState<string>("5")
  const [title, setTitle] = useState<string>("")
  const [comment, setComment] = useState<string>("")
  const [status, setStatus] = useState<AdminReview["review_status"]>("pending")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resetFields = () => {
    setProductId("")
    setUserId(NONE_VALUE)
    setRating("5")
    setTitle("")
    setComment("")
    setStatus("pending")
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!productId || !rating) {
      return
    }

    setError(null)
    setIsSubmitting(true)
    try {
      const result = await createReviewAdminAction({
        product_id: productId,
        user_id: userId !== NONE_VALUE ? userId : null,
        rating: Math.min(5, Math.max(1, parseInt(rating, 10) || 1)),
        title: title.trim() || null,
        comment: comment.trim() || null,
        review_status: status,
      })

      if (!result.success) {
        setError(result.error ?? "Failed to create review")
        return
      }

      resetFields()
      setOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create review")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    resetFields()
    setOpen(false)
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Create Review
      </Button>

      <Dialog open={open} onOpenChange={(next) => {
        if (!next) resetFields()
        setOpen(next)
      }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Review</DialogTitle>
          </DialogHeader>

          <form className="space-y-4 mt-2" onSubmit={handleSubmit}>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <div className="space-y-2">
              <Label htmlFor="review-product">
                Product <span className="text-destructive">*</span>
              </Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger id="review-product">
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="review-user">User (optional)</Label>
              <Select value={userId} onValueChange={setUserId}>
                <SelectTrigger id="review-user">
                  <SelectValue placeholder="Select a user or leave as guest" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>Guest / Anonymous</SelectItem>
                  {profiles.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="review-rating">
                  Rating <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="review-rating"
                  type="number"
                  min={1}
                  max={5}
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="review-status">Status</Label>
                <Select
                  value={status}
                  onValueChange={(value) =>
                    setStatus(value as AdminReview["review_status"])
                  }
                >
                  <SelectTrigger id="review-status">
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
              <Label htmlFor="review-title">Title</Label>
              <Input
                id="review-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Short summary of the review"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="review-comment">Comment</Label>
              <Textarea
                id="review-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write the review comment here..."
                rows={4}
              />
            </div>

            <DialogFooter className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!productId || !rating || isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Review"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
