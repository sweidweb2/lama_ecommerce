import { Suspense } from 'react'
import { getProducts } from '@/services/product.service'
import { ProductGrid } from '@/components/(public)/products/ProductGrid'
import { SearchBar } from '@/components/(public)/products/SearchBar'
import { Pagination } from '@/components/(public)/products/Pagination'
import { ROUTES } from '@/lib/constants/routes'

interface SearchPageProps {
  searchParams: Promise<{
    q?: string
    page?: string
  }>
}

const PAGE_SIZE = 12

export const metadata = {
  title: 'Search | LAMA',
  description: 'Search products.',
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams
  const q = (params.q || '').trim()
  const page = Math.max(1, parseInt(params.page || '1', 10) || 1)

  const productsResult = q
    ? await getProducts({
        search: q,
        page,
        pageSize: PAGE_SIZE,
        sort: 'created_at-desc',
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
            : 'Find products by name.'}
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
            Enter a product name above to see matching results.
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-6">
            {productsResult.count} result{productsResult.count === 1 ? '' : 's'}
          </p>
          <ProductGrid products={productsResult.data} />
          {productsResult.count > 0 && (
            <Suspense fallback={null}>
              <Pagination totalPages={totalPages} basePath={ROUTES.SEARCH} />
            </Suspense>
          )}
          {productsResult.count > 0 && (
            <p className="sr-only">
              Page {currentPage} of {totalPages}
            </p>
          )}
        </>
      )}
    </div>
  )
}
