import { getProducts, getProductPriceBoundsService } from '@/services/product.service'
import { getCategoriesService } from '@/services/categories.service'
import { ProductsPageClient } from '@/components/(public)/products/ProductsPageClient'

interface ProductsPageProps {
    searchParams: Promise<{
        category?: string
        sort?: string
        page?: string
        search?: string
        colors?: string
        sizes?: string
        minPrice?: string
        maxPrice?: string
    }>
}

const PAGE_SIZE = 12

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
    const params = await searchParams

    const page = Math.max(1, parseInt(params.page || '1', 10) || 1)
    const minPrice = params.minPrice != null ? parseFloat(params.minPrice) : undefined
    const maxPrice = params.maxPrice != null ? parseFloat(params.maxPrice) : undefined

    const [categories, bounds, productsResult] = await Promise.all([
        getCategoriesService(),
        getProductPriceBoundsService(),
        getProducts({
            categorySlug: params.category || undefined,
            sort: params.sort || 'created_at-desc',
            page,
            pageSize: PAGE_SIZE,
            search: params.search || undefined,
            minPrice: minPrice != null && !Number.isNaN(minPrice) ? minPrice : undefined,
            maxPrice: maxPrice != null && !Number.isNaN(maxPrice) ? maxPrice : undefined,
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
        />
    )
}
