"use client"

import { ProductGrid } from './ProductGrid'
import { SearchBar } from './SearchBar'
import { MobileFilters } from './MobileFilters'
import type { ProductWithRelations, Category } from '@/types/product'

interface ClientProductFilterProps {
    products: ProductWithRelations[]
    categories: Category[]
    totalPages: number
    currentPage: number
    onPageChange: (page: number) => void
    priceBoundsMin: number
    priceBoundsMax: number
    selectedCategory: string | null
    sort: string
    priceRange: [number, number]
    onCategoryChange: (category: string | null) => void
    onSortChange: (value: string) => void
    onPriceChange: (range: [number, number]) => void
}

export function ClientProductFilter({
    products,
    categories,
    totalPages,
    currentPage,
    onPageChange,
    priceBoundsMin,
    priceBoundsMax,
    selectedCategory,
    sort,
    priceRange,
    onCategoryChange,
    onSortChange,
    onPriceChange,
}: ClientProductFilterProps) {
    return (
        <>
            <div className="w-full md:w-auto flex flex-col sm:flex-row items-center gap-4 bg-muted/30 p-2 rounded-xl border border-border/50 backdrop-blur-sm mb-6">
                <div className="w-full flex items-center gap-2 md:gap-4">
                    <div className="flex-1">
                        <SearchBar />
                    </div>
                    <MobileFilters
                        categories={categories}
                        selectedCategory={selectedCategory}
                        sort={sort}
                        priceBoundsMin={priceBoundsMin}
                        priceBoundsMax={priceBoundsMax}
                        priceRange={priceRange}
                        onCategoryChange={onCategoryChange}
                        onSortChange={onSortChange}
                        onPriceChange={onPriceChange}
                    />
                </div>
            </div>
            <ProductGrid products={products} />

            {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                    </span>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1 text-sm rounded-md border border-border bg-background disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <button
                            type="button"
                            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 text-sm rounded-md border border-border bg-background disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}
