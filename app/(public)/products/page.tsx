import { Suspense } from 'react'
import { createSupabaseServerComponentClient } from '@/lib/supabase/server'
import { getProducts } from '@/services/products.service'
import { getCategories } from '@/services/categories.service'
import { ProductGrid } from '@/components/(public)/products/ProductGrid'
import { CategoryFiltering } from '@/components/(public)/products/CategoryFiltering'
import { Sorting } from '@/components/(public)/products/Sorting'
import { Pagination } from '@/components/(public)/products/Pagination'
import { SearchBar } from '@/components/(public)/products/SearchBar'
import { MobileFilters } from '@/components/(public)/products/MobileFilters'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { DUMMY_PRODUCTS, DUMMY_CATEGORIES } from '@/lib/constants/dummy-data'


interface ProductsPageProps {
    searchParams: Promise<{
        category?: string
        sort?: string
        page?: string
        search?: string
    }>
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
    const params = await searchParams
    const supabase = await createSupabaseServerComponentClient()

    // Fetch categories for the sidebar
    let categories = await getCategories(supabase)
    if (categories.length === 0) categories = DUMMY_CATEGORIES


    // Fetch products with filters
    let { data: products, count } = await getProducts(supabase, {
        categorySlug: params.category,
        sort: params.sort,
        page: Number(params.page) || 1,
        search: params.search,
    })

    // Dummy data fallback for design visualization
    if (products.length === 0 && !params.search) {
        let allProducts = DUMMY_PRODUCTS

        // Filter dummy data if category is selected
        if (params.category) {
            allProducts = allProducts.filter(p => p.category?.slug === params.category)
        }

        count = allProducts.length

        // Apply pagination to dummy data
        const currentPage = Number(params.page) || 1
        const pageSize = 12
        const startIndex = (currentPage - 1) * pageSize
        const endIndex = startIndex + pageSize
        products = allProducts.slice(startIndex, endIndex)
    }

    const pageSize = 12
    const totalPages = Math.ceil(count / pageSize)

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar - Hidden on mobile, visible on desktop */}
                <aside className="hidden md:block w-full md:w-64 shrink-0">
                    <div className="sticky top-24">
                        <CategoryFiltering categories={categories} />
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
                                <div className="h-6 w-px bg-border hidden md:block" />
                                <div className="w-full sm:w-auto">
                                    <Sorting />
                                </div>
                            </div>
                        </div>

                        <Separator className="opacity-50" />
                    </div>

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
