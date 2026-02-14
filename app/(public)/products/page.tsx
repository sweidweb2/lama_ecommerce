import { Suspense } from 'react'
import { getProducts } from '@/services/product.service'
import { getCategoriesService } from '@/services/categories.service'
import { ProductGrid } from '@/components/(public)/products/ProductGrid'
import { CategoryFiltering } from '@/components/(public)/products/CategoryFiltering'
import { AdvancedFilters } from '@/components/(public)/products/AdvancedFilters'
import { SizeFilter } from '@/components/(public)/products/SizeFilter'
import { Pagination } from '@/components/(public)/products/Pagination'
import { SearchBar } from '@/components/(public)/products/SearchBar'
import { MobileFilters } from '@/components/(public)/products/MobileFilters'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import type { ProductWithRelations } from '@/types/product'


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

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL']

function getPrimaryVariantValue(product: ProductWithRelations, field: 'color' | 'size'): string {
    const variant = product.variants?.[0]
    const value = variant?.[field] ?? ''
    return (value || '').toString()
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
    const params = await searchParams

    // Fetch categories for the sidebar
    const categories = await getCategoriesService()

    // Fetch all products for price calculation (without pagination)
    const { data: allProductsForPriceCalc } = await getProducts({
        page: 1,
        pageSize: 10000, // Large number to get all products
    })

    // Fetch products with filters
    let { data: products, count } = await getProducts({
        categorySlug: params.category,
        sort: params.sort,
        page: Number(params.page) || 1,
        search: params.search,
    })

    // Apply color filtering for real products (requires variants)
    if (params.colors && products.length > 0) {
        const selectedColors = params.colors
            .split(',')
            .map(c => c.trim().toLowerCase())
            .filter(Boolean)

        if (selectedColors.length > 0) {
            products = products.filter(product =>
                product.variants?.some(variant =>
                    variant.color && selectedColors.includes(variant.color.toLowerCase()),
                ),
            )
            count = products.length
        }
    }

    // Apply size filtering for real products (requires variants)
    if (params.sizes && products.length > 0) {
        const selectedSizes = params.sizes
            .split(',')
            .map(s => s.trim().toUpperCase())
            .filter(Boolean)

        if (selectedSizes.length > 0) {
            products = products.filter(product =>
                product.variants?.some(variant =>
                    variant.size && selectedSizes.includes(variant.size.toUpperCase()),
                ),
            )
            count = products.length
        }
    }

    // Apply price filtering for real products
    if (params.minPrice || params.maxPrice) {
        const minPrice = params.minPrice ? parseFloat(params.minPrice) : 0
        const maxPrice = params.maxPrice ? parseFloat(params.maxPrice) : Infinity

        if (!isNaN(minPrice) && !isNaN(maxPrice)) {
            products = products.filter(product => {
                const price = product.price
                return price >= minPrice && price <= maxPrice
            })
            count = products.length
        }
    }

    const pageSize = 12
    const totalPages = Math.ceil(count / pageSize)

    // Calculate price range from all available real products
    const prices = allProductsForPriceCalc.map(p => p.price)
    const calculatedMinPrice = prices.length > 0 ? Math.floor(Math.min(...prices)) : 0
    const calculatedMaxPrice = prices.length > 0 ? Math.ceil(Math.max(...prices)) : 1000

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar - Hidden on mobile, visible on desktop */}
                <aside className="hidden md:block w-full md:w-64 shrink-0">
                    <div className="sticky top-24 max-h-[calc(100vh-6rem)] overflow-y-auto pr-2 hide-scrollbar">
                        <div className="space-y-6 pb-4">
                            <CategoryFiltering categories={categories} />
                            <SizeFilter categorySlug={params.category} />
                            <AdvancedFilters 
                                minPrice={calculatedMinPrice}
                                maxPrice={calculatedMaxPrice}
                            />
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1">
                    <div className="mb-8">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                            <div>
                                <h1 className="text-4xl font-bold tracking-tight text-foreground">
                                    {params.category ? categories.find(c => c.slug === params.category)?.name : 'All Products'}
                                </h1>
                                <p className="text-muted-foreground mt-2">
                                    Showing <span className="text-foreground font-medium">{products.length}</span> of <span className="text-foreground font-medium">{count}</span> products
                                </p>
                            </div>

                            {/* The "Screen Bar" / Tools Bar */}
                            <div className="w-full md:w-auto flex flex-col sm:flex-row items-center gap-4 bg-muted/30 p-2 rounded-xl border border-border/50 backdrop-blur-sm">
                                <div className="w-full flex items-center gap-2 md:gap-4">
                                    <div className="flex-1">
                                        <SearchBar />
                                    </div>
                                    <MobileFilters categories={categories} />
                                </div>
                            </div>
                        </div>

                        <Separator className="opacity-50" />
                    </div>

                    <Pagination totalPages={totalPages} />

                    <Suspense fallback={<ProductGridSkeleton />}>
                        <ProductGrid products={products} />
                    </Suspense>

                    <Pagination totalPages={totalPages} />
                </main>
            </div>
        </div>
    )
}
function ProductGridSkeleton() {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-3">
                    <Skeleton className="aspect-[4/5] w-full rounded-xl" />
                    <div className="space-y-2">
                        <Skeleton className="h-3 w-1/3" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-1/4" />
                    </div>
                </div>
            ))}
        </div>
    )
}
