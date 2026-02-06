import { Star, MessageSquare, CheckCircle2, Clock, XCircle } from "lucide-react"
import { CreateReviewDialog, type AdminReview } from "@/components/admin/review/create_form"
import { ReviewsTable } from "@/components/admin/review/ReviewsTable"
import { StatCard } from "@/components/admin/stat-card"

// Dummy data matching the reviews schema + display fields
const reviews: AdminReview[] = [
  {
    id: "review-1",
    product_id: "prod-1",
    product_name: "Wireless Headphones",
    user_id: "user-1",
    user_name: "John Doe",
    rating: 5,
    title: "Amazing sound",
    comment: "Great product, highly recommend!",
    review_status: "approved",
    created_at: "2024-01-15T10:30:00Z",
  },
  {
    id: "review-2",
    product_id: "prod-2",
    product_name: "Smart Watch",
    user_id: "user-2",
    user_name: "Jane Smith",
    rating: 4,
    title: "Good but battery could be better",
    comment: "Good quality, but battery could be better.",
    review_status: "approved",
    created_at: "2024-01-16T09:20:00Z",
  },
  {
    id: "review-3",
    product_id: "prod-3",
    product_name: "Laptop Stand",
    user_id: "user-3",
    user_name: "Bob Johnson",
    rating: 3,
    title: "Average",
    comment: "It's okay, nothing special.",
    review_status: "pending",
    created_at: "2024-01-16T14:45:00Z",
  },
  {
    id: "review-4",
    product_id: "prod-1",
    product_name: "Wireless Headphones",
    user_id: null,
    user_name: null,
    rating: 5,
    title: "Love it",
    comment: "Amazing quality, would buy again.",
    review_status: "approved",
    created_at: "2024-01-17T11:15:00Z",
  },
]

export default function ReviewsPage() {
  const totalReviews = reviews.length
  const pendingReviews = reviews.filter((r) => r.review_status === "pending").length
  const approvedReviews = reviews.filter((r) => r.review_status === "approved").length
  const rejectedReviews = reviews.filter((r) => r.review_status === "rejected").length
  const avgRating =
    totalReviews > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
      : "0.0"

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Reviews</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage product reviews and ratings
          </p>
        </div>
        <div className="mt-1">
          <CreateReviewDialog />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Reviews"
          value={totalReviews}
          description="All time"
          icon={MessageSquare}
        />
        <StatCard
          title="Approved"
          value={approvedReviews}
          description="Published reviews"
          icon={CheckCircle2}
        />
        <StatCard
          title="Pending"
          value={pendingReviews}
          description="Awaiting moderation"
          icon={Clock}
        />
        <StatCard
          title="Rejected"
          value={rejectedReviews}
          description="Not published"
          icon={XCircle}
        />
      </div>

      <ReviewsTable reviews={reviews} />
    </div>
  )
}
