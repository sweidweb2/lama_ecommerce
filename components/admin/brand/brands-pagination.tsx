'use client'

import { Button } from "@/components/ui/button"

interface BrandsPaginationProps {
  currentPage: number
  pageCount: number
  totalItems: number
  pageFrom: number
  pageTo: number
  onPageChange: (page: number) => void
}

export function BrandsPagination({
  currentPage,
  pageCount,
  totalItems,
  pageFrom,
  pageTo,
  onPageChange,
}: BrandsPaginationProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-muted-foreground">
        Showing{" "}
        <span className="font-medium">
          {totalItems === 0 ? 0 : pageFrom}
        </span>{" "}
        to{" "}
        <span className="font-medium">
          {totalItems === 0 ? 0 : pageTo}
        </span>{" "}
        of{" "}
        <span className="font-medium">{totalItems}</span>{" "}
        brands
      </p>

      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          Previous
        </Button>
        <span className="text-xs text-muted-foreground">
          Page{" "}
          <span className="font-medium">
            {currentPage}
          </span>{" "}
          of{" "}
          <span className="font-medium">
            {pageCount}
          </span>
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= pageCount}
        >
          Next
        </Button>
      </div>
    </div>
  )
}

