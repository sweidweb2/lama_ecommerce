'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { TableWrapper } from '@/components/admin/table-wrapper'
import { EditReviewDialog } from '@/components/admin/review/edit_form'
import { DeleteReviewDialog } from '@/components/admin/review/delete_dialog'
import { AdminPagination } from '@/components/admin/product/AdminPagination'
import type { AdminReview } from '@/components/admin/review/create_form'
import { Star, X } from 'lucide-react'

interface ReviewsTableProps {
  reviews: AdminReview[]
  totalCount: number
  page: number
  pageSize: number
  initialStatus: string
  initialRating: string
  initialProductQuery: string
}

const DEBOUNCE_MS = 300

const renderStars = (rating: number) => {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
          }`}
        />
      ))}
    </div>
  )
}

const getStatusVariant = (status: AdminReview['review_status']) => {
  switch (status) {
    case 'approved':
      return 'default'
    case 'pending':
      return 'secondary'
    case 'rejected':
      return 'destructive'
    default:
      return 'secondary'
  }
}

export function ReviewsTable({
  reviews,
  totalCount,
  page,
  pageSize,
  initialStatus,
  initialRating,
  initialProductQuery,
}: ReviewsTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [productQuery, setProductQuery] = useState(initialProductQuery)

  useEffect(() => {
    setProductQuery(initialProductQuery)
  }, [initialProductQuery])

  const pushParams = useCallback(
    (next: {
      status?: string
      rating?: string
      q?: string
      resetPage?: boolean
    }) => {
      const params = new URLSearchParams(searchParams.toString())
      const status = next.status ?? params.get('status') ?? 'all'
      const rating = next.rating ?? params.get('rating') ?? 'all'
      const q =
        next.q !== undefined ? next.q : (params.get('q') ?? '')

      if (status === 'all') params.delete('status')
      else params.set('status', status)

      if (rating === 'all') params.delete('rating')
      else params.set('rating', rating)

      if (!q.trim()) params.delete('q')
      else params.set('q', q.trim())

      if (next.resetPage !== false) {
        params.delete('page')
      }

      const query = params.toString()
      router.push(query ? `/admin/reviews?${query}` : '/admin/reviews')
    },
    [router, searchParams],
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      if (productQuery.trim() === initialProductQuery.trim()) return
      pushParams({ q: productQuery, resetPage: true })
    }, DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [productQuery, initialProductQuery, pushParams])

  const statusFilter = initialStatus || 'all'
  const ratingFilter = initialRating || 'all'

  const hasActiveFilters =
    statusFilter !== 'all' ||
    ratingFilter !== 'all' ||
    initialProductQuery.trim() !== ''

  const clearFilters = () => {
    setProductQuery('')
    router.push('/admin/reviews')
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize) || 1)
  const showingStart = reviews.length > 0 ? (page - 1) * pageSize + 1 : 0
  const showingEnd = (page - 1) * pageSize + reviews.length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              Product:
            </span>
            <Input
              placeholder="Search product..."
              value={productQuery}
              onChange={(e) => setProductQuery(e.target.value)}
              className="w-[200px]"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              Status:
            </span>
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                pushParams({ status: value, resetPage: true })
              }
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              Rating:
            </span>
            <Select
              value={ratingFilter}
              onValueChange={(value) =>
                pushParams({ rating: value, resetPage: true })
              }
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Ratings" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                {[1, 2, 3, 4, 5].map((rating) => (
                  <SelectItem key={rating} value={String(rating)}>
                    {rating} stars
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-8 px-2 lg:px-3"
            >
              <X className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          )}
        </div>

        <p className="text-sm text-muted-foreground">
          {totalCount === 0
            ? '0 reviews'
            : `Showing ${showingStart}–${showingEnd} of ${totalCount}`}
        </p>
      </div>

      {totalPages > 1 && (
        <AdminPagination totalPages={totalPages} basePath="/admin/reviews" />
      )}

      <TableWrapper>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Comment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviews.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground py-8"
                >
                  {hasActiveFilters
                    ? 'No reviews match the filters'
                    : 'No reviews found'}
                </TableCell>
              </TableRow>
            ) : (
              reviews.map((review) => (
                <TableRow key={review.id}>
                  <TableCell className="font-medium">
                    {review.product_name}
                  </TableCell>
                  <TableCell>{review.user_name || 'Guest / Anonymous'}</TableCell>
                  <TableCell>{renderStars(review.rating)}</TableCell>
                  <TableCell className="max-w-md truncate">
                    {review.comment || review.title || '—'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={getStatusVariant(review.review_status)}
                      className="capitalize"
                    >
                      {review.review_status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {review.created_at
                      ? new Date(review.created_at).toLocaleDateString()
                      : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <EditReviewDialog review={review} />
                      <DeleteReviewDialog
                        review={{
                          id: review.id,
                          product_name: review.product_name,
                          user_name: review.user_name,
                          rating: review.rating,
                        }}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableWrapper>

      {totalPages > 1 && (
        <AdminPagination totalPages={totalPages} basePath="/admin/reviews" />
      )}
    </div>
  )
}
