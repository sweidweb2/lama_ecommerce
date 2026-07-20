import { Star, MessageSquare, CheckCircle2, Clock, XCircle } from "lucide-react"
import { CreateReviewDialog, type AdminReview } from "@/components/admin/review/create_form"
import { ReviewsTable } from "@/components/admin/review/ReviewsTable"
import { StatCard } from "@/components/admin/stat-card"
import {
  listReviewsForAdminService,
  getAdminReviewStatsService,
  type AdminReviewStats,
} from "@/services/review.service"
import { getAdminProductsService } from "@/services/product.service"
import { getProfilesForAdmin } from "@/services/profile.service"
import {
  ADMIN_REVIEWS_PAGE_SIZE,
  parseAdminReviewsListParams,
  type AdminReviewsListSearchParams,
} from "@/lib/admin/reviews-list-params"

interface ReviewsPageProps {
  searchParams: Promise<AdminReviewsListSearchParams>
}

export default async function ReviewsPage({ searchParams }: ReviewsPageProps) {
  const params = await searchParams
  const listParams = parseAdminReviewsListParams(
    params,
    ADMIN_REVIEWS_PAGE_SIZE,
  )

  let reviews: AdminReview[] = []
  let totalCount = 0
  let stats: AdminReviewStats = {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    avgRating: "0.0",
  }
  let products: { id: string; name: string }[] = []
  let profiles: { id: string; name: string }[] = []
  let error: string | null = null

  try {
    const [listResult, statsResult, productsData, profilesData] =
      await Promise.all([
        listReviewsForAdminService(listParams),
        getAdminReviewStatsService(),
        getAdminProductsService(),
        getProfilesForAdmin(),
      ])

    reviews = listResult.items.map((r) => ({
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
    totalCount = listResult.total
    stats = statsResult
    products = productsData.map((p) => ({ id: p.id, name: p.name }))
    profiles = profilesData
      .filter((pr) => Boolean(pr.user_id))
      .map((pr) => ({
        id: pr.user_id as string,
        name: pr.full_name ?? pr.email ?? "Unknown",
      }))
  } catch (e) {
    console.error("Failed to load reviews:", e)
    error = "Failed to load reviews. Make sure you are signed in as an admin."
  }

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
          <CreateReviewDialog products={products} profiles={profiles} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard
          title="Total Reviews"
          value={stats.total}
          description="All time"
          icon={MessageSquare}
        />
        <StatCard
          title="Approved"
          value={stats.approved}
          description="Published reviews"
          icon={CheckCircle2}
        />
        <StatCard
          title="Pending"
          value={stats.pending}
          description="Awaiting moderation"
          icon={Clock}
        />
        <StatCard
          title="Rejected"
          value={stats.rejected}
          description="Not published"
          icon={XCircle}
        />
        <StatCard
          title="Avg Rating"
          value={stats.avgRating}
          description="Approved reviews"
          icon={Star}
        />
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          <p className="font-medium">Error loading reviews</p>
          <p className="text-sm">{error}</p>
        </div>
      ) : (
        <ReviewsTable
          reviews={reviews}
          totalCount={totalCount}
          page={listParams.page}
          pageSize={listParams.pageSize}
          initialStatus={listParams.status ?? "all"}
          initialRating={
            listParams.rating != null ? String(listParams.rating) : "all"
          }
          initialProductQuery={listParams.productQuery ?? ""}
        />
      )}
    </div>
  )
}
