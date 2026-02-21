import { getProducts } from '@/services/product.service'
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

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
    const params = await searchParams

    // Fetch categories for the sidebar
    const categories = await getCategoriesService()

    // Fetch all products for client-side filtering (without pagination)
    const { data: allProducts } = await getProducts({
        categorySlug: undefined, // Get all products, filtering will be done client-side
        sort: undefined,
        page: 1,
        pageSize: 10000, // Large number to get all products for client-side filtering
    })

    // Calculate price range from all available products
    const prices = allProducts.map(p => Number(p.price))
    const calculatedMinPrice = prices.length > 0 ? Math.floor(Math.min(...prices)) : 0
    const calculatedMaxPrice = prices.length > 0 ? Math.ceil(Math.max(...prices)) : 1000

    return (
        <ProductsPageClient
            initialProducts={allProducts}
            categories={categories}
            initialCategory={params.category || null}
            calculatedMinPrice={calculatedMinPrice}
            calculatedMaxPrice={calculatedMaxPrice}
        />
    )
}
