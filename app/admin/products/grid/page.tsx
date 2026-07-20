import { AdminProductGrid } from '@/components/admin/product/AdminProductGrid'
import { AdminPagination } from '@/components/admin/product/AdminPagination'
import { GridFilters } from '@/components/admin/product/GridFilters'
import { ProductStats } from '@/components/admin/product/ProductStats'
import {
  getAdminProductsPageService,
  getAdminProductCatalogStatsService,
} from '@/services/product.service'
import { getBrandsService } from '@/services/brand.service'
import { getAdminCategoriesService } from '@/services/categories.service'
import { encryptOrderId } from '@/lib/utils/encryption'
import { ProductsSectionBreadcrumbs } from '@/components/admin/AdminBreadcrumbs'
import {
  ADMIN_PRODUCTS_GRID_PAGE_SIZE,
  parseAdminProductsListParams,
} from '@/lib/admin/products-list-params'

interface GridProductsPageProps {
  searchParams: Promise<{
    page?: string
    category?: string
    brand?: string
    featured?: string
    trending?: string
    active?: string
    stock?: string
  }>
}

export default async function GridProductsPage({ searchParams }: GridProductsPageProps) {
  const params = await searchParams
  const listParams = parseAdminProductsListParams(
    params,
    ADMIN_PRODUCTS_GRID_PAGE_SIZE,
  )

  const [pageResult, catalogStats, brands, categories] = await Promise.all([
    getAdminProductsPageService(listParams),
    getAdminProductCatalogStatsService(),
    getBrandsService(),
    getAdminCategoriesService(),
  ])

  const totalPages = Math.max(
    1,
    Math.ceil(pageResult.totalCount / pageResult.pageSize) || 1,
  )
  const showingStart =
    pageResult.products.length > 0
      ? (pageResult.page - 1) * pageResult.pageSize + 1
      : 0
  const showingEnd =
    (pageResult.page - 1) * pageResult.pageSize + pageResult.products.length

  return (
    <div className="space-y-6">
      <ProductsSectionBreadcrumbs current="Grid view" />
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Grid Products</h1>
        <p className="text-muted-foreground text-sm sm:text-base mt-2">
          View all products in a grid layout
        </p>
      </div>

      <ProductStats stats={catalogStats} />

      <GridFilters brands={brands} categories={categories} />

      <div className="mb-4">
        <p className="text-sm text-muted-foreground">
          Showing <span className="text-foreground font-medium">{showingStart}</span>
          {' - '}
          <span className="text-foreground font-medium">{showingEnd}</span>
          {' of '}
          <span className="text-foreground font-medium">{pageResult.totalCount}</span>
          {' products'}
        </p>
      </div>

      {totalPages > 1 && <AdminPagination totalPages={totalPages} />}

      <AdminProductGrid
        products={pageResult.products.map((p) => ({
          ...p,
          encryptedId: encryptOrderId(p.id),
        }))}
        brands={brands}
        categories={categories}
      />

      {totalPages > 1 && <AdminPagination totalPages={totalPages} />}
    </div>
  )
}
