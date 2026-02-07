'use client'

import { Star, Eye, ShoppingCart, ShoppingBag, TrendingUp } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
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

// Dummy reviews for demonstration
const DUMMY_REVIEWS: Review[] = [
  {
    id: 'review-1',
    product_id: '',
    user_id: null,
    rating: 5,
    title: 'Outstanding quality!',
    comment: 'This product is absolutely fantastic. The quality is top-notch and it exceeded all my expectations. Highly recommend to anyone looking for a premium product.',
    review_status: 'approved',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    deleted_at: null,
  },
  {
    id: 'review-2',
    product_id: '',
    user_id: null,
    rating: 4,
    title: 'Great value',
    comment: 'Really good product for the price. Works well and looks great. The only minor issue is the packaging could be better, but the product itself is excellent.',
    review_status: 'approved',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    deleted_at: null,
  },
  {
    id: 'review-3',
    product_id: '',
    user_id: null,
    rating: 5,
    title: 'Perfect purchase',
    comment: 'I\'m very satisfied with this purchase. The product arrived quickly and in perfect condition. It works exactly as described and I couldn\'t be happier.',
    review_status: 'approved',
    created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(), // 12 days ago
    deleted_at: null,
  },
  {
    id: 'review-4',
    product_id: '',
    user_id: null,
    rating: 3,
    title: 'It\'s okay',
    comment: 'The product is decent but nothing special. It does what it\'s supposed to do, but I expected a bit more for the price. Still functional though.',
    review_status: 'approved',
    created_at: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(), // 18 days ago
    deleted_at: null,
  },
  {
    id: 'review-5',
    product_id: '',
    user_id: null,
    rating: 5,
    title: 'Amazing!',
    comment: 'This is one of the best products I\'ve ever bought. The quality is exceptional and it has all the features I need. Very satisfied with my purchase!',
    review_status: 'approved',
    created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(), // 25 days ago
    deleted_at: null,
  },
  {
    id: 'review-6',
    product_id: '',
    user_id: null,
    rating: 4,
    title: 'Good overall',
    comment: 'Solid product with good build quality. The design is modern and it performs well. Would definitely recommend to others looking for something similar.',
    review_status: 'approved',
    created_at: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000).toISOString(), // 32 days ago
    deleted_at: null,
  },
  {
    id: 'review-7',
    product_id: '',
    user_id: null,
    rating: 5,
    title: 'Exceeded expectations',
    comment: 'I was pleasantly surprised by how good this product is. The quality is much better than I expected and it works perfectly. Great value for money!',
    review_status: 'approved',
    created_at: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(), // 40 days ago
    deleted_at: null,
  },
]

/**
 * ProductReviews Component
 * 
 * Maps to: reviews table
 *          review_status (pending, approved, rejected)
 * 
 * Displays:
 * - Average rating
 * - Rating distribution
 * - Individual reviews (approved only)
 * - Review submission (future)
 */
export function ProductReviews({ productId, reviews = [], stats }: ProductReviewsProps) {
  // Filter approved reviews only, and add dummy reviews if none exist
  const approvedReviews = useMemo(() => {
    const realReviews = reviews.filter(
      (r) => r.review_status === 'approved' && !r.deleted_at
    )
    
    // If no real reviews, use dummy reviews
    if (realReviews.length === 0) {
      return DUMMY_REVIEWS.map(review => ({
        ...review,
        product_id: productId,
      }))
    }
    
    return realReviews
  }, [reviews, productId])

  // Calculate average rating
  const averageRating =
    approvedReviews.length > 0
      ? approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length
      : 0

  const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: approvedReviews.filter((r) => r.rating === rating).length,
  }))

  // Dummy statistics if not provided
  const productStats = stats || {
    views_count: Math.floor(Math.random() * 5000) + 1000,
    add_to_cart_count: Math.floor(Math.random() * 800) + 100,
    purchase_count: Math.floor(Math.random() * 500) + 50,
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
                <div className="flex items-center gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        "h-5 w-5",
                        star <= Math.round(averageRating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "fill-gray-200 text-gray-200"
                      )}
                    />
                  ))}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {approvedReviews.length} review{approvedReviews.length !== 1 ? 's' : ''}
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
