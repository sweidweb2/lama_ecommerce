import type { Metadata } from 'next'
import {
    getProducts,
    getProductPriceBoundsService,
    getProductVariantFacetsService,
} from '@/services/product.service'
import { getCategoriesService } from '@/services/category.service'
import { ProductsPageClient } from '@/components/(public)/products/ProductsPageClient'
import { normalizeColorValue } from '@/lib/constants/color-palette'

export const metadata: Metadata = {
    title: 'Products',
    description: 'Browse the Aviora Wear catalog. Filter by category, brand, color, size, and price.',
}

interface ProductsPageProps {
    searchParams: Promise<{
        category?: string | string[]
        brand?: string | string[]
        sort?: string | string[]
        page?: string | string[]
        search?: string | string[]
        colors?: string | string[]
        sizes?: string | string[]
        minPrice?: string | string[]
        maxPrice?: string | string[]
    }>
}

const PAGE_SIZE = 32

function firstParam(value: string | string[] | undefined): string | undefined {
    if (Array.isArray(value)) {
        return value.find((v) => typeof v === 'string' && v.length > 0)
    }
    return typeof value === 'string' ? value : undefined
}

function parseListParam(raw: string | undefined): string[] {
    if (!raw) return []
    return raw
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean)
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
    const params = await searchParams
    const category = firstParam(params.category)
    const brand = firstParam(params.brand)
    const sort = firstParam(params.sort) || 'created_at-desc'
    const search = firstParam(params.search)

    const page = Math.max(1, parseInt(firstParam(params.page) || '1', 10) || 1)
    const minRaw = firstParam(params.minPrice)
    const maxRaw = firstParam(params.maxPrice)
    const minPrice = minRaw != null ? parseFloat(minRaw) : undefined
    const maxPrice = maxRaw != null ? parseFloat(maxRaw) : undefined
    const colors = parseListParam(firstParam(params.colors)).map(normalizeColorValue).filter(Boolean)
    const sizes = parseListParam(firstParam(params.sizes))

    const [categories, bounds, facets, productsResult] = await Promise.all([
        getCategoriesService(),
        getProductPriceBoundsService(),
        getProductVariantFacetsService(),
        getProducts({
            categorySlug: category || undefined,
            brandSlug: brand || undefined,
            sort,
            page,
            pageSize: PAGE_SIZE,
            search: search || undefined,
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
            selectedCategory={category || null}
            sort={sort}
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
