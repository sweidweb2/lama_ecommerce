"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

const MAX_PAGE_BUTTONS = 10

interface ContactPaginationProps {
  currentPage: number
  pageCount: number
  totalItems: number
  pageFrom: number
  pageTo: number
  onPageChange: (page: number) => void
}

function getVisiblePages(currentPage: number, pageCount: number): number[] {
  if (pageCount <= MAX_PAGE_BUTTONS) {
    return Array.from({ length: pageCount }, (_, i) => i + 1)
  }
  const half = Math.floor(MAX_PAGE_BUTTONS / 2)
  let start = Math.max(1, currentPage - half)
  let end = Math.min(pageCount, start + MAX_PAGE_BUTTONS - 1)
  if (end - start + 1 < MAX_PAGE_BUTTONS) {
    start = Math.max(1, end - MAX_PAGE_BUTTONS + 1)
  }
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

export function ContactPagination({
  currentPage,
  pageCount,
  totalItems,
  pageFrom,
  pageTo,
  onPageChange,
}: ContactPaginationProps) {
  const visiblePages = getVisiblePages(currentPage, pageCount)

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-muted-foreground">
        Showing{" "}
        <span className="font-medium">{totalItems === 0 ? 0 : pageFrom}</span> to{" "}
        <span className="font-medium">{totalItems === 0 ? 0 : pageTo}</span> of{" "}
        <span className="font-medium">{totalItems}</span> messages
      </p>

      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-1">
          {visiblePages.map((page) => (
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
          disabled={currentPage >= pageCount}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
