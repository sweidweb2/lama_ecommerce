import { Star, MessageSquare, CheckCircle2, Clock, XCircle } from "lucide-react"
import { CreateReviewDialog, type AdminReview } from "@/components/admin/review/create_form"
import { ReviewsTable } from "@/components/admin/review/ReviewsTable"
import { StatCard } from "@/components/admin/stat-card"
import { getAllReviewsForAdminService } from "@/services/review.service"

export default async function ReviewsPage() {
  let reviews: AdminReview[] = []
  let error: string | null = null

  try {
    const reviewsData = await getAllReviewsForAdminService()
    // Map AdminReviewRow to AdminReview format
    reviews = reviewsData.map((r) => ({
      id: r.id,
      product_id: r.product_id,
      product_name: r.product_name,
      user_id: r.user_id,
      user_name: r.user_name,
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      review_status: r.review_status,
      created_at: r.created_at,
    }))
  } catch (e) {
    console.error("Failed to load reviews:", e)
    error = "Failed to load reviews. Make sure you are signed in as an admin."
  }

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

      {error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          <p className="font-medium">Error loading reviews</p>
          <p className="text-sm">{error}</p>
        </div>
      ) : (
        <ReviewsTable reviews={reviews} />
      )}
    </div>
  )
}
