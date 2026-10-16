import type { Metadata } from 'next'
import {
    getProducts,
    getProductPriceBoundsService,
    getProductVariantFacetsService,
} from '@/services/product.service'
import { getCategoriesService } from '@/services/categories.service'
import { ProductsPageClient } from '@/components/(public)/products/ProductsPageClient'
import { normalizeColorValue } from '@/lib/constants/color-palette'

export const metadata: Metadata = {
    title: 'Products',
    description: 'Browse the Aviora Wear catalog. Filter by category, brand, color, size, and price.',
}

interface ProductsPageProps {
    searchParams: Promise<{
        category?: string
        brand?: string
        sort?: string
        page?: string
        search?: string
        colors?: string
        sizes?: string
        minPrice?: string
        maxPrice?: string
    }>
}

const PAGE_SIZE = 32

function parseListParam(raw: string | undefined): string[] {
    if (!raw) return []
    return raw
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean)
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
    const params = await searchParams

    const page = Math.max(1, parseInt(params.page || '1', 10) || 1)
    const minPrice = params.minPrice != null ? parseFloat(params.minPrice) : undefined
    const maxPrice = params.maxPrice != null ? parseFloat(params.maxPrice) : undefined
    const colors = parseListParam(params.colors).map(normalizeColorValue).filter(Boolean)
    const sizes = parseListParam(params.sizes)

    const [categories, bounds, facets, productsResult] = await Promise.all([
        getCategoriesService(),
        getProductPriceBoundsService(),
        getProductVariantFacetsService(),
        getProducts({
            categorySlug: params.category || undefined,
            brandSlug: params.brand || undefined,
            sort: params.sort || 'created_at-desc',
            page,
            pageSize: PAGE_SIZE,
            search: params.search || undefined,
            minPrice: minPrice != null && !Number.isNaN(minPrice) ? minPrice : undefined,
            maxPrice: maxPrice != null && !Number.isNaN(maxPrice) ? maxPrice : undefined,
            colors: colors.length > 0 ? colors : undefined,
            sizes: sizes.length > 0 ? sizes : undefined,
        }),
    ])

    const totalPages = Math.max(1, Math.ceil(productsResult.count / PAGE_SIZE))

    return (
        <ProductsPageClient
            products={productsResult.data}
            totalCount={productsResult.count}
            totalPages={totalPages}
            currentPage={Math.min(page, totalPages)}
            categories={categories}
            selectedCategory={params.category || null}
            sort={params.sort || 'created_at-desc'}
            priceBoundsMin={bounds.minPrice}
            priceBoundsMax={bounds.maxPrice}
            priceRange={[
                minPrice != null && !Number.isNaN(minPrice) ? minPrice : bounds.minPrice,
                maxPrice != null && !Number.isNaN(maxPrice) ? maxPrice : bounds.maxPrice,
            ]}
            search={params.search || ''}
            availableColors={facets.colors}
            availableSizes={facets.sizes}
            selectedColors={colors}
            selectedSizes={sizes}
        />
    )
}
