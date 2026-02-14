import { getProducts } from '@/services/product.service'
import { getCategoriesService } from '@/services/categories.service'
import { CategoryFiltering } from '@/components/(public)/products/CategoryFiltering'
import { AdvancedFilters } from '@/components/(public)/products/AdvancedFilters'
import { SizeFilter } from '@/components/(public)/products/SizeFilter'
import { ClientProductFilter } from '@/components/(public)/products/ClientProductFilter'
import { Separator } from '@/components/ui/separator'
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

    // Fetch all products for client-side filtering (without pagination)
    const { data: allProducts } = await getProducts({
        categorySlug: params.category,
        sort: params.sort,
        page: 1,
        pageSize: 10000, // Large number to get all products for client-side filtering
    })

    // Use all products for client-side filtering
    let products = allProducts

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
        }
    }

    // Calculate price range from all available real products
    const prices = allProducts.map(p => p.price)
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
                                    Browse our collection of products
                                </p>
                            </div>
                        </div>

                        <Separator className="opacity-50" />
                    </div>

                    <ClientProductFilter 
                        initialProducts={products}
                        categories={categories}
                    />
                </main>
            </div>
        </div>
    )
}
