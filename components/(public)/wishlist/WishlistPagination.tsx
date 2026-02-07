'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface WishlistPaginationProps {
    totalPages: number
}

export function WishlistPagination({ totalPages }: WishlistPaginationProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const currentPage = Number(searchParams.get('page')) || 1

    const handlePageChange = (page: number) => {
        const params = new URLSearchParams(searchParams.toString())
        if (page === 1) {
            params.delete('page')
        } else {
            params.set('page', page.toString())
        }
        router.push(`/wishlist?${params.toString()}`)
    }

    if (totalPages <= 1) return null

    // Limit to max 20 pages
    const maxPages = Math.min(totalPages, 20)
    const pagesToShow = Math.min(maxPages, 10) // Show up to 10 page buttons at a time

    // Calculate which pages to show
    let startPage = Math.max(1, currentPage - Math.floor(pagesToShow / 2))
    let endPage = Math.min(maxPages, startPage + pagesToShow - 1)

    if (endPage - startPage < pagesToShow - 1) {
        startPage = Math.max(1, endPage - pagesToShow + 1)
    }

    return (
        <div className="flex items-center justify-center gap-2 mt-8">
            <Button
                variant="outline"
                size="icon"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-1">
                {startPage > 1 && (
                    <>
                        <Button
                            variant={currentPage === 1 ? 'default' : 'outline'}
                            size="sm"
                            className="w-9"
                            onClick={() => handlePageChange(1)}
                        >
                            1
                        </Button>
                        {startPage > 2 && <span className="px-2 text-muted-foreground">...</span>}
                    </>
                )}

                {Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map((page) => (
                    <Button
                        key={page}
                        variant={currentPage === page ? 'default' : 'outline'}
                        size="sm"
                        className="w-9"
                        onClick={() => handlePageChange(page)}
                    >
                        {page}
                    </Button>
                ))}

                {endPage < maxPages && (
                    <>
                        {endPage < maxPages - 1 && <span className="px-2 text-muted-foreground">...</span>}
                        <Button
                            variant={currentPage === maxPages ? 'default' : 'outline'}
                            size="sm"
                            className="w-9"
                            onClick={() => handlePageChange(maxPages)}
                        >
                            {maxPages}
                        </Button>
                    </>
                )}
            </div>

            <Button
                variant="outline"
                size="icon"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= maxPages}
            >
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    )
}
