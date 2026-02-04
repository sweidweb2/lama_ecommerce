'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
    totalPages: number
}

export function Pagination({ totalPages }: PaginationProps) {
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
        router.push(`/products?${params.toString()}`)
    }

    if (totalPages <= 1) return null

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
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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
            </div>

            <Button
                variant="outline"
                size="icon"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
            >
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    )
}
