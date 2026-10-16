"use client"

import { Loader2, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProductGrid } from './ProductGrid'
import { SearchBar } from './SearchBar'
import { MobileFilters } from './MobileFilters'
import { Pagination } from './Pagination'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils'
import type { ProductWithRelations, Category } from '@/types/product'

interface ClientProductFilterProps {
    products: ProductWithRelations[]
    categories: Category[]
    totalPages: number
    currentPage: number
    onPageChange: (page: number) => void
    isPageLoading?: boolean
    isFiltersOpen: boolean
    onToggleFilters: () => void
    priceBoundsMin: number
    priceBoundsMax: number
    selectedCategory: string | null
    sort: string
    priceRange: [number, number]
    onCategoryChange: (category: string | null) => void
    onSortChange: (value: string) => void
    onPriceChange: (range: [number, number]) => void
    availableColors: string[]
    availableSizes: string[]
    selectedColors: string[]
    selectedSizes: string[]
    onColorsChange: (colors: string[]) => void
    onSizesChange: (sizes: string[]) => void
}

export function ClientProductFilter({
    products,
    categories,
    totalPages,
    currentPage,
    onPageChange,
    isPageLoading = false,
    isFiltersOpen,
    onToggleFilters,
    priceBoundsMin,
    priceBoundsMax,
    selectedCategory,
    sort,
    priceRange,
    onCategoryChange,
    onSortChange,
    onPriceChange,
    availableColors,
    availableSizes,
    selectedColors,
    selectedSizes,
    onColorsChange,
    onSizesChange,
}: ClientProductFilterProps) {
    return (
        <>
            <div className="w-full md:w-auto flex flex-col sm:flex-row items-center gap-4 bg-muted/30 p-2 rounded-xl border border-border/50 backdrop-blur-sm mb-6">
                <div className="w-full flex items-center gap-2 md:gap-4">
                    <div className="flex-1 min-w-0">
                        <SearchBar href={ROUTES.PRODUCTS} />
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
                        availableColors={availableColors}
                        availableSizes={availableSizes}
                        selectedColors={selectedColors}
                        selectedSizes={selectedSizes}
                        onColorsChange={onColorsChange}
                        onSizesChange={onSizesChange}
                    />
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="hidden md:inline-flex shrink-0"
                        aria-expanded={isFiltersOpen}
                        aria-controls="product-filters"
                        onClick={onToggleFilters}
                    >
                        {isFiltersOpen ? (
                            <PanelLeftClose className="h-4 w-4" />
                        ) : (
                            <PanelLeftOpen className="h-4 w-4" />
                        )}
                        {isFiltersOpen ? "Hide filters" : "Show filters"}
                    </Button>
                </div>
            </div>

            <Pagination
                totalPages={totalPages}
                currentPage={currentPage}
                onPageChange={onPageChange}
                isLoading={isPageLoading}
                className="mb-6"
            />

            <div className={cn('relative', isPageLoading && 'opacity-60')}>
                {isPageLoading ? (
                    <div
                        className="pointer-events-none absolute inset-0 z-10 flex items-start justify-center pt-16"
                        role="status"
                        aria-live="polite"
                        aria-label="Loading products"
                    >
                        <div className="rounded-full border bg-background/90 p-3 shadow-sm">
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            <span className="sr-only">Loading products</span>
                        </div>
                    </div>
                ) : null}
                <ProductGrid products={products} />
            </div>

            <Pagination
                totalPages={totalPages}
                currentPage={currentPage}
                onPageChange={onPageChange}
                isLoading={isPageLoading}
                className="mt-8"
            />
        </>
    )
}
