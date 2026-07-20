'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Star } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/lib/constants/routes'
import type { Review } from '@/types/product_utf8'
import { createReviewAction } from '@/actions/review'
import { useAuth } from '@/providers/AuthProvider'
import { ROLES } from '@/lib/constants/roles'

interface ProductCommentsProps {
  productId: string
  productSlug: string
  reviews?: Review[]
  isAuthenticated: boolean
}

/**
 * ProductComments Component
 *
 * Maps to: reviews table
 *          review_status (pending, approved, rejected)
 *
 * Features:
 * - Display approved reviews/comments
 * - Submit new review/comment (authenticated customers)
 * - Guest CTA to sign in before reviewing
 * - Admins cannot write storefront reviews
 */
export function ProductComments({
  productId,
  productSlug,
  reviews = [],
  isAuthenticated,
}: ProductCommentsProps) {
  const { role } = useAuth()
  const isAdmin = role === ROLES.ADMIN
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const approvedReviews = useMemo(() => {
    return reviews.filter((r) => r.review_status === 'approved')
  }, [reviews])

  const loginHref = `${ROUTES.LOGIN}?redirect=${encodeURIComponent(`/products/${productSlug}`)}`

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

        setRating(0)
        setTitle('')
        setComment('')
      } else {
        toast.error('Error', {
          description: result.error || 'Failed to submit review. Please try again.',
        })
      }
    } catch {
      toast.error('Error', {
        description: 'Failed to submit review. Please try again.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Reviews</h2>

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
                                'h-4 w-4',
                                star <= review.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'fill-gray-200 text-gray-200'
                              )}
                            />
                          ))}
                        </div>
                        {review.title && (
                          <h3 className="font-semibold text-lg">{review.title}</h3>
                        )}
                      </div>
                      {review.comment && (
                        <p className="text-muted-foreground leading-relaxed">
                          {review.comment}
                        </p>
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

        {/* Right: Add Review Form or Sign-in CTA */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">Write a Review</h3>

            {isAdmin ? (
              <div className="space-y-4 rounded-lg border p-6">
                <p className="text-muted-foreground">
                  Admins cannot leave storefront reviews. Moderate reviews from the admin panel.
                </p>
                <Button asChild size="lg" className="w-full" variant="outline">
                  <Link href={ROUTES.ADMIN}>Go to Admin Panel</Link>
                </Button>
              </div>
            ) : !isAuthenticated ? (
              <div className="space-y-4 rounded-lg border p-6">
                <p className="text-muted-foreground">
                  Sign in to share your experience with this product.
                </p>
                <Button asChild size="lg" className="w-full">
                  <Link href={loginHref}>Sign in to review</Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-6">
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
                            'h-8 w-8 transition-colors cursor-pointer',
                            star <= (hoveredRating || rating)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'fill-gray-200 text-gray-200 hover:fill-yellow-200 hover:text-yellow-200'
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

                <div className="space-y-2">
                  <Label htmlFor="review-title">Title (Optional)</Label>
                  <Input
                    id="review-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Give your review a title"
                  />
                </div>

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

                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting || rating === 0 || !comment.trim()}
                  className="w-full"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Review'}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
