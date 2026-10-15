"use client"

import { useCallback, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CategoryFiltering } from '@/components/(public)/products/CategoryFiltering'
import { Sorting } from '@/components/(public)/products/Sorting'
import { PriceFilter } from '@/components/(public)/products/PriceFilter'
import { VariantFilters } from '@/components/(public)/products/VariantFilters'
import { SizeFilter } from '@/components/(public)/products/SizeFilter'
import { ClientProductFilter } from '@/components/(public)/products/ClientProductFilter'
import { Separator } from '@/components/ui/separator'
import { normalizeColorValue } from '@/lib/constants/color-palette'
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
    availableColors: string[]
    availableSizes: string[]
    selectedColors: string[]
    selectedSizes: string[]
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
    availableColors,
    availableSizes,
    selectedColors,
    selectedSizes,
}: ProductsPageClientProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isFiltersOpen, setIsFiltersOpen] = useState(true)

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

    const handleColorsChange = (colors: string[]) => {
        pushParams((params) => {
            if (colors.length === 0) params.delete('colors')
            else params.set('colors', colors.map(normalizeColorValue).join(','))
            params.delete('page')
        })
    }

    const handleSizesChange = (sizes: string[]) => {
        pushParams((params) => {
            if (sizes.length === 0) params.delete('sizes')
            else params.set('sizes', sizes.join(','))
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
                {isFiltersOpen ? (
                    <aside id="product-filters" className="hidden md:block w-72 shrink-0">
                        <div className="sticky top-24 max-h-[calc(100vh-6rem)] overflow-y-auto pl-6 pr-2 hide-scrollbar">
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
                                <VariantFilters
                                    availableColors={availableColors}
                                    value={selectedColors}
                                    onChange={handleColorsChange}
                                />
                                <SizeFilter
                                    availableSizes={availableSizes}
                                    selectedSizes={selectedSizes}
                                    onSizesChange={handleSizesChange}
                                />
                            </div>
                        </div>
                    </aside>
                ) : null}

                {/* Main Content */}
                <main className="min-w-0 flex-1">
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
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="hidden md:inline-flex"
                                aria-expanded={isFiltersOpen}
                                aria-controls="product-filters"
                                onClick={() => setIsFiltersOpen((open) => !open)}
                            >
                                {isFiltersOpen ? (
                                    <PanelLeftClose className="h-4 w-4" />
                                ) : (
                                    <PanelLeftOpen className="h-4 w-4" />
                                )}
                                {isFiltersOpen ? "Hide filters" : "Show filters"}
                            </Button>
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
                        availableColors={availableColors}
                        availableSizes={availableSizes}
                        selectedColors={selectedColors}
                        selectedSizes={selectedSizes}
                        onColorsChange={handleColorsChange}
                        onSizesChange={handleSizesChange}
                    />
                </main>
            </div>
        </div>
    )
}
