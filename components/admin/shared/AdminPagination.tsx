"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

const MAX_PAGE_BUTTONS = 10

export interface AdminClientPaginationProps {
  currentPage: number
  pageCount: number
  totalItems: number
  pageFrom: number
  pageTo: number
  onPageChange: (page: number) => void
  /** Plural noun shown in the summary, e.g. "messages" -> "of 12 messages". */
  itemLabel?: string
  /**
   * `pages`: chevron buttons + numbered page buttons.
   * `prev-next`: "Previous" / "Next" text buttons with "Page X of Y".
   */
  variant?: "pages" | "prev-next"
}

function getVisiblePages(currentPage: number, pageCount: number): number[] {
  if (pageCount <= MAX_PAGE_BUTTONS) {
    return Array.from({ length: pageCount }, (_, i) => i + 1)
  }
  const half = Math.floor(MAX_PAGE_BUTTONS / 2)
  let start = Math.max(1, currentPage - half)
  const end = Math.min(pageCount, start + MAX_PAGE_BUTTONS - 1)
  if (end - start + 1 < MAX_PAGE_BUTTONS) {
    start = Math.max(1, end - MAX_PAGE_BUTTONS + 1)
  }
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

/**
 * Shared admin pagination for client-side (state-driven) lists.
 * URL-driven pagination for server-rendered tables lives in
 * `components/admin/product/AdminUrlPagination.tsx`.
 */
export function AdminPagination({
  currentPage,
  pageCount,
  totalItems,
  pageFrom,
  pageTo,
  onPageChange,
  itemLabel = "items",
  variant = "pages",
}: AdminClientPaginationProps) {
  const isPrevDisabled = currentPage <= 1
  const isNextDisabled = currentPage >= pageCount

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-muted-foreground">
        Showing{" "}
        <span className="font-medium">{totalItems === 0 ? 0 : pageFrom}</span> to{" "}
        <span className="font-medium">{totalItems === 0 ? 0 : pageTo}</span> of{" "}
        <span className="font-medium">{totalItems}</span> {itemLabel}
      </p>

      {variant === "prev-next" ? (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={isPrevDisabled}
          >
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            Page <span className="font-medium">{currentPage}</span> of{" "}
            <span className="font-medium">{pageCount}</span>
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={isNextDisabled}
          >
            Next
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={isPrevDisabled}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1">
            {getVisiblePages(currentPage, pageCount).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                className="w-9"
                onClick={() => onPageChange(page)}
              >
                {page}
              </Button>
            ))}
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={isNextDisabled}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
