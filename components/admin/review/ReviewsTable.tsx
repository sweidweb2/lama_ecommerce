'use client'

import { useMemo, useState } from 'react'
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
import type { AdminReview } from '@/components/admin/review/create_form'
import { Star, X, ChevronLeft, ChevronRight } from 'lucide-react'

interface ReviewsTableProps {
  reviews: AdminReview[]
}

const REVIEWS_PER_PAGE = 20
const MAX_PAGES = 100

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

export function ReviewsTable({ reviews }: ReviewsTableProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [ratingFilter, setRatingFilter] = useState<string>('all')
  const [productFilter, setProductFilter] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)

  const uniqueStatuses = useMemo(
    () => Array.from(new Set(reviews.map((r) => r.review_status))).sort(),
    [reviews],
  )

  const uniqueRatings = useMemo(
    () => Array.from(new Set(reviews.map((r) => r.rating))).sort((a, b) => a - b),
    [reviews],
  )

  // Filter on full reviews data
  const filteredReviews = useMemo(() => {
    return reviews.filter((review) => {
      const matchesStatus = statusFilter === 'all' || review.review_status === statusFilter
      const matchesRating =
        ratingFilter === 'all' || review.rating === parseInt(ratingFilter, 10)
      const matchesProduct =
        !productFilter ||
        review.product_name.toLowerCase().includes(productFilter.toLowerCase())

      return matchesStatus && matchesRating && matchesProduct
    })
  }, [reviews, statusFilter, ratingFilter, productFilter])

  // Limit total number of reviews to respect max pages
  const maxReviewsToShow = MAX_PAGES * REVIEWS_PER_PAGE
  const limitedFilteredReviews = useMemo(
    () => filteredReviews.slice(0, maxReviewsToShow),
    [filteredReviews, maxReviewsToShow],
  )

  const totalPages = useMemo(
    () =>
      Math.min(
        Math.ceil(limitedFilteredReviews.length / REVIEWS_PER_PAGE),
        MAX_PAGES,
      ),
    [limitedFilteredReviews.length],
  )

  const paginatedReviews = useMemo(() => {
    const startIndex = (currentPage - 1) * REVIEWS_PER_PAGE
    const endIndex = startIndex + REVIEWS_PER_PAGE
    return limitedFilteredReviews.slice(startIndex, endIndex)
  }, [limitedFilteredReviews, currentPage])

  const handleFilterChange = () => {
    setCurrentPage(1)
  }

  const hasActiveFilters =
    statusFilter !== 'all' || ratingFilter !== 'all' || productFilter !== ''

  const clearFilters = () => {
    setStatusFilter('all')
    setRatingFilter('all')
    setProductFilter('')
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              Product:
            </span>
            <Input
              placeholder="Search product..."
              value={productFilter}
              onChange={(e) => {
                setProductFilter(e.target.value)
                handleFilterChange()
              }}
              className="w-[200px]"
            />
          </div>

          {uniqueStatuses.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                Status:
              </span>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value)
                  handleFilterChange()
                }}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {uniqueStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {uniqueRatings.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                Rating:
              </span>
              <Select
                value={ratingFilter}
                onValueChange={(value) => {
                  setRatingFilter(value)
                  handleFilterChange()
                }}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Ratings" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  {uniqueRatings.map((rating) => (
                    <SelectItem key={rating} value={String(rating)}>
                      {rating} stars
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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
      </div>

      {/* Pagination - Top */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
              let pageNum: number
              if (totalPages <= 10) {
                pageNum = i + 1
              } else if (currentPage <= 5) {
                pageNum = i + 1
              } else if (currentPage >= totalPages - 4) {
                pageNum = totalPages - 9 + i
              } else {
                pageNum = currentPage - 5 + i
              }
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                  className="w-10"
                >
                  {pageNum}
                </Button>
              )
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
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
            {paginatedReviews.length === 0 ? (
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
              paginatedReviews.map((review) => (
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

      {/* Pagination - Bottom */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
              let pageNum: number
              if (totalPages <= 10) {
                pageNum = i + 1
              } else if (currentPage <= 5) {
                pageNum = i + 1
              } else if (currentPage >= totalPages - 4) {
                pageNum = totalPages - 9 + i
              } else {
                pageNum = currentPage - 5 + i
              }
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                  className="w-10"
                >
                  {pageNum}
                </Button>
              )
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

