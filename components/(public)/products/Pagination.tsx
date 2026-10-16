'use client'

import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaginationProps {
    totalPages: number
    currentPage: number
    onPageChange: (page: number) => void
    isLoading?: boolean
    className?: string
}

function getVisiblePages(currentPage: number, totalPages: number): number[] {
    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    const pages = new Set<number>([1, totalPages, currentPage])
    for (let offset = 1; offset <= 2; offset += 1) {
        pages.add(currentPage - offset)
        pages.add(currentPage + offset)
    }

    return [...pages]
        .filter((page) => page >= 1 && page <= totalPages)
        .sort((a, b) => a - b)
}

export function Pagination({
    totalPages,
    currentPage,
    onPageChange,
    isLoading = false,
    className,
}: PaginationProps) {
    if (totalPages <= 1) return null

    const visiblePages = getVisiblePages(currentPage, totalPages)

    return (
        <div
            className={cn(
                'flex flex-wrap items-center justify-center gap-2',
                className,
            )}
            aria-busy={isLoading}
        >
            <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={isLoading || currentPage <= 1}
                aria-label="Previous page"
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-1">
                {visiblePages.map((page, index) => {
                    const previous = visiblePages[index - 1]
                    const showEllipsis = previous != null && page - previous > 1

                    return (
                        <div key={page} className="flex items-center gap-1">
                            {showEllipsis ? (
                                <span className="px-1 text-sm text-muted-foreground">
                                    …
                                </span>
                            ) : null}
                            <Button
                                type="button"
                                variant={currentPage === page ? 'default' : 'outline'}
                                size="sm"
                                className="w-9"
                                onClick={() => onPageChange(page)}
                                disabled={isLoading}
                                aria-current={currentPage === page ? 'page' : undefined}
                            >
                                {page}
                            </Button>
                        </div>
                    )
                })}
            </div>

            <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={isLoading || currentPage >= totalPages}
                aria-label="Next page"
            >
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    )
}
