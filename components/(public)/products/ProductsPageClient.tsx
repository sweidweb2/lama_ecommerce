"use client"

import { useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CategoryFiltering } from '@/components/(public)/products/CategoryFiltering'
import { Sorting } from '@/components/(public)/products/Sorting'
import { PriceFilter } from '@/components/(public)/products/PriceFilter'
import { ClientProductFilter } from '@/components/(public)/products/ClientProductFilter'
import { Separator } from '@/components/ui/separator'
import type { ProductWithRelations, Category } from '@/types/product'

interface ProductsPageClientProps {
    products: ProductWithRelations[]
    totalCount: number
    totalPages: number
    currentPage: number
    categories: Category[]
    selectedCategory: string | null
    sort: string
    priceBoundsMin: number
    priceBoundsMax: number
    priceRange: [number, number]
    search: string
}

export function ProductsPageClient({
    products,
    totalCount,
    totalPages,
    currentPage,
    categories,
    selectedCategory,
    sort,
    priceBoundsMin,
    priceBoundsMax,
    priceRange,
    search,
}: ProductsPageClientProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const pushParams = useCallback(
        (mutate: (params: URLSearchParams) => void) => {
            const params = new URLSearchParams(searchParams.toString())
            mutate(params)
            const qs = params.toString()
            router.push(qs ? `/products?${qs}` : '/products')
        },
        [router, searchParams],
    )

    const handleCategoryChange = (category: string | null) => {
        pushParams((params) => {
            if (category) params.set('category', category)
            else params.delete('category')
            params.delete('page')
        })
    }

    const handleSortChange = (value: string) => {
        pushParams((params) => {
            params.set('sort', value)
            params.delete('page')
        })
    }

    const handlePriceChange = (range: [number, number]) => {
        pushParams((params) => {
            params.set('minPrice', String(range[0]))
            params.set('maxPrice', String(range[1]))
            params.delete('page')
        })
    }

    const handlePageChange = (page: number) => {
        pushParams((params) => {
            if (page <= 1) params.delete('page')
            else params.set('page', String(page))
        })
    }

    const currentCategoryName = selectedCategory
        ? categories.find(c => c.slug === selectedCategory)?.name
        : 'All Products'

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar - Hidden on mobile, visible on desktop */}
                <aside className="hidden md:block w-full md:w-64 shrink-0">
                    <div className="sticky top-24 max-h-[calc(100vh-6rem)] overflow-y-auto pr-2 hide-scrollbar">
                        <div className="space-y-6 pb-4">
                            <CategoryFiltering
                                categories={categories}
                                selectedCategory={selectedCategory}
                                onCategoryChange={handleCategoryChange}
                            />
                            <Sorting
                                value={sort}
                                onChange={handleSortChange}
                            />
                            <PriceFilter
                                minPrice={priceBoundsMin}
                                maxPrice={priceBoundsMax}
                                value={priceRange}
                                onChange={handlePriceChange}
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
                                    {currentCategoryName}
                                </h1>
                                <p className="text-muted-foreground mt-2">
                                    {totalCount} product{totalCount === 1 ? '' : 's'}
                                    {search ? ` matching “${search}”` : ''}
                                </p>
                            </div>
                        </div>

                        <Separator className="opacity-50" />
                    </div>

                    <ClientProductFilter
                        products={products}
                        categories={categories}
                        totalPages={totalPages}
                        currentPage={currentPage}
                        onPageChange={handlePageChange}
                        priceBoundsMin={priceBoundsMin}
                        priceBoundsMax={priceBoundsMax}
                        selectedCategory={selectedCategory}
                        sort={sort}
                        priceRange={priceRange}
                        onCategoryChange={handleCategoryChange}
                        onSortChange={handleSortChange}
                        onPriceChange={handlePriceChange}
                    />
                </main>
            </div>
        </div>
    )
}
