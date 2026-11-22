import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getProducts } from '@/services/product.service'
import { ProductGrid } from '@/components/(public)/products/ProductGrid'
import { SearchBar } from '@/components/(public)/products/SearchBar'
import { SearchPagination } from '@/components/(public)/products/SearchPagination'
import {
  Sorting,
  ALLOWED_SORT_VALUES,
  DEFAULT_SORT,
} from '@/components/(public)/products/Sorting'
import { ROUTES } from '@/lib/constants/routes'

interface SearchPageProps {
  searchParams: Promise<{
    q?: string | string[]
    page?: string | string[]
    sort?: string | string[]
  }>
}

const PAGE_SIZE = 12

export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const params = await searchParams
  const q = (firstParam(params.q) || '').trim()

  return {
    title: q ? `Search “${q}”` : 'Search',
    description: q
      ? `Search results for “${q}” at Aviora Wear.`
      : 'Search products by name, description, SKU, or brand.',
  }
}

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value.find((v) => typeof v === 'string' && v.length > 0)
  return typeof value === 'string' ? value : undefined
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams
  const q = (firstParam(params.q) || '').trim()
  const page = Math.max(1, parseInt(firstParam(params.page) || '1', 10) || 1)
  const rawSort = firstParam(params.sort)
  const sort =
    rawSort && ALLOWED_SORT_VALUES.has(rawSort) ? rawSort : DEFAULT_SORT

  const productsResult = q
    ? await getProducts({
        search: q,
        page,
        pageSize: PAGE_SIZE,
        sort,
      })
    : { data: [], count: 0 }

  const totalPages = Math.max(1, Math.ceil(productsResult.count / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)

  return (
    <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-12 sm:py-16 lg:py-20 xl:py-24">
      <div className="mb-10 max-w-xl">
        <h1 className="text-4xl font-black tracking-tight text-foreground">Search</h1>
        <p className="text-muted-foreground mt-2">
          {q
            ? `Results for “${q}”`
            : 'Find products by name, description, SKU, or brand.'}
        </p>
        <div className="mt-6">
          <Suspense fallback={<div className="h-10 max-w-sm rounded-md border bg-muted/30" />}>
            <SearchBar href={ROUTES.SEARCH} />
          </Suspense>
        </div>
      </div>

      {!q ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <h3 className="text-xl font-semibold">Start a search</h3>
          <p className="text-muted-foreground mt-2">
            Enter a product name, description, SKU, or brand above to see matching results.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {productsResult.count} result{productsResult.count === 1 ? '' : 's'}
            </p>
            <div className="w-full sm:w-56">
              <Suspense fallback={<div className="h-10 rounded-md border bg-muted/30" />}>
                <Sorting basePath={ROUTES.SEARCH} />
              </Suspense>
            </div>
          </div>
          <ProductGrid products={productsResult.data} />
          {productsResult.count > 0 && (
            <Suspense fallback={null}>
              <SearchPagination
                totalPages={totalPages}
                currentPage={currentPage}
              />
            </Suspense>
          )}
        </>
      )}
    </div>
  )
}
