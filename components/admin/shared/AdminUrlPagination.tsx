'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface AdminUrlPaginationProps {
  totalPages: number
  basePath?: string
  onNavigate?: (href: string) => void
}

function visiblePages(current: number, total: number): number[] {
  if (total <= 9) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const pages = new Set<number>([1, total, current])
  for (let i = current - 2; i <= current + 2; i++) {
    if (i >= 1 && i <= total) pages.add(i)
  }
  return [...pages].sort((a, b) => a - b)
}

/** URL-driven admin pagination (`?page=`). Client-state lists use `AdminPagination`. */
export function AdminUrlPagination({
  totalPages,
  basePath = '/admin/products',
  onNavigate,
}: AdminUrlPaginationProps) {
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
    // Display mode is client-only; never keep it in the URL.
    params.delete('view')
    const query = params.toString()
    const href = query ? `${basePath}?${query}` : basePath
    if (onNavigate) onNavigate(href)
    else router.push(href)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (totalPages <= 1) return null

  const pages = visiblePages(currentPage, totalPages)

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
        {pages.map((page, index) => {
          const prev = pages[index - 1]
          const showEllipsis = prev !== undefined && page - prev > 1
          return (
            <div key={page} className="flex items-center gap-1">
              {showEllipsis && (
                <span className="px-1 text-muted-foreground text-sm">…</span>
              )}
              <Button
                variant={currentPage === page ? 'default' : 'outline'}
                size="sm"
                className="w-9"
                onClick={() => handlePageChange(page)}
              >
                {page}
              </Button>
            </div>
          )
        })}
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
