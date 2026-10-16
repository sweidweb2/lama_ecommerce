'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Pagination } from '@/components/(public)/products/Pagination'
import { ROUTES } from '@/lib/constants/routes'

interface SearchPaginationProps {
  totalPages: number
  currentPage: number
}

export function SearchPagination({
  totalPages,
  currentPage,
}: SearchPaginationProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [pendingSearchKey, setPendingSearchKey] = useState<string | null>(null)

  const currentSearchKey = searchParams.toString()
  const isWaitingForUrl =
    pendingSearchKey !== null && pendingSearchKey !== currentSearchKey
  const isLoading = isPending || isWaitingForUrl

  useEffect(() => {
    if (pendingSearchKey === null) return
    const timer = setTimeout(() => setPendingSearchKey(null), 8000)
    return () => clearTimeout(timer)
  }, [pendingSearchKey])

  const handlePageChange = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams.toString())
      if (page <= 1) params.delete('page')
      else params.set('page', String(page))
      const qs = params.toString()
      if (qs === currentSearchKey) return
      setPendingSearchKey(qs)
      startTransition(() => {
        router.push(qs ? `${ROUTES.SEARCH}?${qs}` : ROUTES.SEARCH)
      })
    },
    [router, searchParams, currentSearchKey],
  )

  return (
    <Pagination
      totalPages={totalPages}
      currentPage={currentPage}
      onPageChange={handlePageChange}
      isLoading={isLoading}
      className="mt-8"
    />
  )
}
