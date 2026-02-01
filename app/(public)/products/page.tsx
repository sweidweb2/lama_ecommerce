import { Suspense } from 'react'
import { createSupabaseServerComponentClient } from '@/lib/supabase/server'
import { getProducts } from '@/services/products.service'
import { getCategories } from '@/services/categories.service'
import { ProductGrid } from '@/components/(storefront)/products/ProductGrid'
import { CategoryFiltering } from '@/components/(storefront)/products/CategoryFiltering'
import { Sorting } from '@/components/(storefront)/products/Sorting'
import { Pagination } from '@/components/(storefront)/products/Pagination'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'

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
    const categories = await getCategories(supabase)

    // Fetch products with filters
    const { data: products, count } = await getProducts(supabase, {
        categorySlug: params.category,
        sort: params.sort,
        page: Number(params.page) || 1,
        search: params.search,
    })

    const pageSize = 12
    const totalPages = Math.ceil(count / pageSize)

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar */}
                <aside className="w-full md:w-64 shrink-0">
                    <CategoryFiltering categories={categories} />
                </aside>

                {/* Main Content */}
                <main className="flex-1">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Products</h1>
                            <p className="text-muted-foreground mt-1">
                                Showing {products.length} of {count} products
                            </p>
                        </div>
                        <Sorting />
                    </div>

                    <Separator className="mb-8" />

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-4">
                    <Skeleton className="aspect-square w-full rounded-xl" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-4 w-full" />
                    </div>
                </div>
            ))}
        </div>
    )
}
