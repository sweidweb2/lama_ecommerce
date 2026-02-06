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
import { Plus } from "lucide-react"

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

// Dummy products & users for selection
const DUMMY_PRODUCTS = [
  { id: "prod-1", name: "Wireless Headphones" },
  { id: "prod-2", name: "Smart Watch" },
  { id: "prod-3", name: "Laptop Stand" },
]

const DUMMY_USERS = [
  { id: "user-1", name: "John Doe" },
  { id: "user-2", name: "Jane Smith" },
  { id: "user-3", name: "Bob Johnson" },
]

const REVIEW_STATUSES: AdminReview["review_status"][] = ["pending", "approved", "rejected"]

const NONE_VALUE = "__none__"

export function CreateReviewDialog() {
  const [open, setOpen] = useState(false)
  const [productId, setProductId] = useState<string>("")
  const [userId, setUserId] = useState<string>(NONE_VALUE)
  const [rating, setRating] = useState<string>("5")
  const [title, setTitle] = useState<string>("")
  const [comment, setComment] = useState<string>("")
  const [status, setStatus] = useState<AdminReview["review_status"]>("pending")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!productId || !rating) {
      return
    }

    const product = DUMMY_PRODUCTS.find((p) => p.id === productId)
    const user = userId !== NONE_VALUE ? DUMMY_USERS.find((u) => u.id === userId) : null

    const newReview: Omit<AdminReview, "id"> = {
      product_id: productId,
      product_name: product?.name || "Unknown product",
      user_id: user?.id || null,
      user_name: user?.name || null,
      rating: Math.min(5, Math.max(1, parseInt(rating) || 1)),
      title: title || null,
      comment: comment || null,
      review_status: status,
      created_at: new Date().toISOString(),
    }

    // TODO: Wire this up to a real admin create action / API
    console.log("Creating review:", newReview)

    setProductId("")
    setUserId(NONE_VALUE)
    setRating("5")
    setTitle("")
    setComment("")
    setStatus("pending")
    setOpen(false)
  }

  const handleCancel = () => {
    setProductId("")
    setUserId(NONE_VALUE)
    setRating("5")
    setTitle("")
    setComment("")
    setStatus("pending")
    setOpen(false)
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Create Review
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Review</DialogTitle>
          </DialogHeader>

          <form className="space-y-4 mt-2" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="review-product">
                Product <span className="text-destructive">*</span>
              </Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger id="review-product">
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {DUMMY_PRODUCTS.map((product) => (
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
                  {DUMMY_USERS.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
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
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!productId || !rating}>
                Create Review
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

