'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Star } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { Review } from '@/types/product_utf8'
import { createReviewAction } from '@/actions/review'

interface ProductCommentsProps {
  productId: string
  reviews?: Review[]
}

// Dummy reviews/comments for demonstration
const DUMMY_REVIEWS: Review[] = [
  {
    id: 'review-1',
    product_id: '',
    user_id: null,
    rating: 5,
    title: 'Excellent product!',
    comment: 'This product exceeded my expectations. The quality is outstanding and it arrived quickly. Highly recommend!',
    review_status: 'approved',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    deleted_at: null,
  },
  {
    id: 'review-2',
    product_id: '',
    user_id: null,
    rating: 4,
    title: 'Great value for money',
    comment: 'Good quality product at a reasonable price. The design is modern and it works as expected. Would buy again.',
    review_status: 'approved',
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    deleted_at: null,
  },
  {
    id: 'review-3',
    product_id: '',
    user_id: null,
    rating: 5,
    title: 'Perfect!',
    comment: 'Absolutely love this product! It\'s exactly what I was looking for. The build quality is impressive and it looks great.',
    review_status: 'approved',
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
    deleted_at: null,
  },
  {
    id: 'review-4',
    product_id: '',
    user_id: null,
    rating: 3,
    title: 'Decent product',
    comment: 'It\'s okay, nothing special. Does the job but I expected a bit more for the price. Still functional though.',
    review_status: 'approved',
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days ago
    deleted_at: null,
  },
  {
    id: 'review-5',
    product_id: '',
    user_id: null,
    rating: 5,
    title: 'Amazing quality!',
    comment: 'This is one of the best purchases I\'ve made. The quality is top-notch and it has all the features I need. Very satisfied!',
    review_status: 'approved',
    created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(), // 25 days ago
    deleted_at: null,
  },
  {
    id: 'review-6',
    product_id: '',
    user_id: null,
    rating: 4,
    title: 'Good product overall',
    comment: 'Solid product with good features. The only minor issue is the packaging could be better, but the product itself is great.',
    review_status: 'approved',
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
    deleted_at: null,
  },
]

/**
 * ProductComments Component
 * 
 * Maps to: reviews table
 *          review_status (pending, approved, rejected)
 * 
 * Features:
 * - Display approved reviews/comments
 * - Submit new review/comment
 * - Rating display
 * - Comment form
 */
export function ProductComments({ productId, reviews = [] }: ProductCommentsProps) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()

    if (rating === 0) {
      toast.error('Please select a rating', {
        description: 'A rating is required to submit a review.',
      })
      return
    }

    if (!comment.trim()) {
      toast.error('Please write a comment', {
        description: 'A comment is required to submit a review.',
      })
      return
    }

    setIsSubmitting(true)

    try {
      const result = await createReviewAction({
        product_id: productId,
        rating,
        title: title.trim() || null,
        comment: comment.trim(),
      })

      if (result.success) {
        toast.success('Review submitted', {
          description: 'Your review has been submitted and is pending approval.',
        })

        // Reset form
        setRating(0)
        setTitle('')
        setComment('')
      } else {
        toast.error('Error', {
          description: result.error || 'Failed to submit review. Please try again.',
        })
      }
    } catch (error) {
      toast.error('Error', {
        description: 'Failed to submit review. Please try again.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Customer Reviews & Comments</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Left: Comments List */}
        <div>
          {approvedReviews.length > 0 ? (
            <div className="max-h-[600px] overflow-y-auto hide-scrollbar space-y-6 pr-2">
              {approvedReviews.map((review) => (
                <div key={review.id} className="space-y-3 pb-6 border-b last:border-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={cn(
                                "h-4 w-4",
                                star <= review.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "fill-gray-200 text-gray-200"
                              )}
                            />
                          ))}
                        </div>
                        {review.title && (
                          <h3 className="font-semibold text-lg">{review.title}</h3>
                        )}
                      </div>
                      {review.comment && (
                        <p className="text-muted-foreground leading-relaxed">{review.comment}</p>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg mb-2">No reviews yet</p>
              <p className="text-sm">Be the first to review this product!</p>
            </div>
          )}
        </div>

        {/* Right: Add Review Form */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">Write a Review</h3>
            
            <form onSubmit={handleSubmitReview} className="space-y-6">
          {/* Rating Selection */}
          <div className="space-y-2">
            <Label>Rating *</Label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="focus:outline-none"
                  aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
                >
                  <Star
                    className={cn(
                      "h-8 w-8 transition-colors cursor-pointer",
                      star <= (hoveredRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "fill-gray-200 text-gray-200 hover:fill-yellow-200 hover:text-yellow-200"
                    )}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-sm text-muted-foreground">
                  {rating} star{rating !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          {/* Title Input */}
          <div className="space-y-2">
            <Label htmlFor="review-title">Title (Optional)</Label>
            <input
              id="review-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your review a title"
              className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Comment Textarea */}
          <div className="space-y-2">
            <Label htmlFor="review-comment">Your Review *</Label>
            <Textarea
              id="review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this product..."
              rows={6}
              className="resize-none"
              required
            />
          </div>

              {/* Submit Button */}
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting || rating === 0 || !comment.trim()}
                className="w-full"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
