import { AdminProductGrid } from '@/components/admin/product/AdminProductGrid'
import { AdminPagination } from '@/components/admin/product/AdminPagination'
import { GridFilters } from '@/components/admin/product/GridFilters'
import { ProductStats } from '@/components/admin/product/ProductStats'
import type { ProductWithRelations } from '@/types/product'
import { getAdminProductsService } from '@/services/product.service'
import { getBrandsService } from '@/services/brand.service'
import { getCategoriesService } from '@/services/categories.service'

interface GridProductsPageProps {
  searchParams: Promise<{
    page?: string
    category?: string
    brand?: string
    featured?: string
    trending?: string
    active?: string
  }>
}

const PRODUCTS_PER_PAGE = 12
const MAX_PAGES = 60

export default async function GridProductsPage({ searchParams }: GridProductsPageProps) {
  const params = await searchParams
  const [productsFromDb, brands, categories] = await Promise.all([
    getAdminProductsService(),
    getBrandsService(),
    getCategoriesService(),
  ])
  const currentPage = Number(params.page) || 1

  // Apply filters to ALL products first
  let filteredProducts: ProductWithRelations[] = [...productsFromDb]

  // Filter by category
  if (params.category && params.category !== 'all') {
    filteredProducts = filteredProducts.filter(
      (p) => p.category_id === params.category
    )
  }

  // Filter by brand
  if (params.brand && params.brand !== 'all') {
    filteredProducts = filteredProducts.filter(
      (p) => p.brand_id === params.brand
    )
  }

  // Filter by featured
  if (params.featured && params.featured !== 'all') {
    const isFeatured = params.featured === 'true'
    filteredProducts = filteredProducts.filter(
      (p) => p.is_featured === isFeatured
    )
  }

  // Filter by trending
  if (params.trending && params.trending !== 'all') {
    const isTrending = params.trending === 'true'
    filteredProducts = filteredProducts.filter(
      (p) => p.is_trending === isTrending
    )
  }

  // Filter by active status
  if (params.active && params.active !== 'all') {
    const isActive = params.active === 'true'
    filteredProducts = filteredProducts.filter(
      (p) => p.is_active === isActive
    )
  }

  // Calculate pagination on filtered results
  const totalFilteredProducts = filteredProducts.length
  const maxProductsToShow = MAX_PAGES * PRODUCTS_PER_PAGE
  const limitedFilteredProducts = filteredProducts.slice(0, maxProductsToShow)
  const totalPages = Math.min(
    Math.ceil(limitedFilteredProducts.length / PRODUCTS_PER_PAGE),
    MAX_PAGES
  )

  // Get products for current page
  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE
  const endIndex = startIndex + PRODUCTS_PER_PAGE
  const paginatedProducts = limitedFilteredProducts.slice(startIndex, endIndex)

  const showingStart = paginatedProducts.length > 0 ? startIndex + 1 : 0
  const showingEnd = startIndex + paginatedProducts.length
  const totalShowing = limitedFilteredProducts.length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Grid Products</h1>
        <p className="text-muted-foreground text-sm sm:text-base mt-2">
          View all products in a grid layout
        </p>
      </div>

      <ProductStats products={productsFromDb} />

      <GridFilters brands={brands} categories={categories} />

      <div className="mb-4">
        <p className="text-sm text-muted-foreground">
          Showing <span className="text-foreground font-medium">{showingStart}</span>
          {' - '}
          <span className="text-foreground font-medium">{showingEnd}</span>
          {' of '}
          <span className="text-foreground font-medium">{totalShowing}</span>
          {totalFilteredProducts > maxProductsToShow && (
            <span className="text-muted-foreground"> (max {maxProductsToShow} shown)</span>
          )}
          {' products'}
        </p>
      </div>

      {/* Pagination - Top */}
      {totalPages > 1 && <AdminPagination totalPages={totalPages} />}

      <AdminProductGrid 
        products={paginatedProducts}
        brands={brands}
        categories={categories}
      />

      {totalPages > 1 && <AdminPagination totalPages={totalPages} />}
    </div>
  )
}
