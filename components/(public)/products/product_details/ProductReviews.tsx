'use client'

import { Star, Eye, ShoppingCart, ShoppingBag, TrendingUp } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useMemo } from 'react'
import type { Review } from '@/types/product_utf8'

interface ProductReviewsProps {
  productId: string
  reviews?: Review[]
  stats?: {
    views_count?: number
    add_to_cart_count?: number
    purchase_count?: number
  }
}

/**
 * ProductReviews Component
 *
 * Uses real data only: reviews from DB (approved), stats from product_stats or 0.
 * When there are no reviews: shows 0 stars and "No reviews yet".
 */
export function ProductReviews({ productId, reviews = [], stats }: ProductReviewsProps) {
  const approvedReviews = useMemo(
    () =>
      reviews.filter(
        (r) => r.review_status === 'approved' && !r.deleted_at
      ),
    [reviews]
  )

  const averageRating =
    approvedReviews.length > 0
      ? approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length
      : 0

  const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: approvedReviews.filter((r) => r.rating === rating).length,
  }))

  const productStats = {
    views_count: stats?.views_count ?? 0,
    add_to_cart_count: stats?.add_to_cart_count ?? 0,
    purchase_count: stats?.purchase_count ?? 0,
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Customer Reviews</h2>
        
        {/* Rating Summary & Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
          {/* Left: Rating Section */}
          <div className="space-y-6">
            <div className="flex items-start gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold">{averageRating.toFixed(1)}</div>
                <div className="flex items-center justify-center gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        "h-5 w-5",
                        approvedReviews.length > 0 && star <= Math.round(averageRating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "fill-gray-200 text-gray-200"
                      )}
                    />
                  ))}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {approvedReviews.length === 0
                    ? "No reviews yet"
                    : `${approvedReviews.length} review${approvedReviews.length !== 1 ? "s" : ""}`}
                </div>
              </div>

              {/* Rating Distribution */}
              <div className="flex-1 space-y-2">
                {ratingDistribution.map(({ rating, count }) => {
                  const percentage =
                    approvedReviews.length > 0
                      ? (count / approvedReviews.length) * 100
                      : 0
                  return (
                    <div key={rating} className="flex items-center gap-3">
                      <span className="text-sm w-8">{rating} star</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-12 text-right">
                        {count}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right: Statistics Section (Desktop only) */}
          <div className="hidden lg:block">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Product Statistics</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Eye className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm font-medium">Total Views</span>
                  </div>
                  <span className="text-lg font-bold">
                    {productStats.views_count?.toLocaleString() || '0'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm font-medium">Added to Cart</span>
                  </div>
                  <span className="text-lg font-bold">
                    {productStats.add_to_cart_count?.toLocaleString() || '0'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm font-medium">Total Purchases</span>
                  </div>
                  <span className="text-lg font-bold">
                    {productStats.purchase_count?.toLocaleString() || '0'}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm font-medium">Conversion Rate</span>
                  </div>
                  <span className="text-lg font-bold text-primary">
                    {productStats.views_count && productStats.purchase_count
                      ? ((productStats.purchase_count / productStats.views_count) * 100).toFixed(1)
                      : '0.0'}
                    %
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
