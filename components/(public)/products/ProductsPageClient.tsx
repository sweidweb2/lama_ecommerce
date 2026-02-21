"use client"

import { useState, useMemo, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { CategoryFiltering } from '@/components/(public)/products/CategoryFiltering'
import { AdvancedFilters } from '@/components/(public)/products/AdvancedFilters'
import { SizeFilter } from '@/components/(public)/products/SizeFilter'
import { ClientProductFilter } from '@/components/(public)/products/ClientProductFilter'
import { Separator } from '@/components/ui/separator'
import type { ProductWithRelations, Category } from '@/types/product'

interface ProductsPageClientProps {
    initialProducts: ProductWithRelations[]
    categories: Category[]
    initialCategory?: string | null
    calculatedMinPrice: number
    calculatedMaxPrice: number
}

export function ProductsPageClient({
    initialProducts,
    categories,
    initialCategory,
    calculatedMinPrice,
    calculatedMaxPrice,
}: ProductsPageClientProps) {
    const searchParams = useSearchParams()
    
    // Filter state - all client-side
    const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory || null)
    const [selectedSizes, setSelectedSizes] = useState<string[]>([])
    const [selectedColors, setSelectedColors] = useState<string[]>([])
    const [priceRange, setPriceRange] = useState<[number, number]>([calculatedMinPrice, calculatedMaxPrice])
    const [sort, setSort] = useState<string>(searchParams.get("sort") || "created_at-desc")

    // Initialize from URL params on mount
    useEffect(() => {
        const categoryParam = searchParams.get('category')
        if (categoryParam) {
            setSelectedCategory(categoryParam)
        }

        const sizesParam = searchParams.get('sizes')
        if (sizesParam) {
            setSelectedSizes(
                sizesParam
                    .split(',')
                    .map((s) => s.trim().toUpperCase())
                    .filter(Boolean)
            )
        }

        const colorsParam = searchParams.get('colors')
        if (colorsParam) {
            setSelectedColors(
                colorsParam
                    .split(',')
                    .map(c => c.trim().toLowerCase())
                    .filter(Boolean)
            )
        }

        const minParam = searchParams.get('minPrice')
        const maxParam = searchParams.get('maxPrice')
        if (minParam && maxParam) {
            const min = parseFloat(minParam)
            const max = parseFloat(maxParam)
            if (!isNaN(min) && !isNaN(max)) {
                setPriceRange([min, max])
            }
        }

        const sortParam = searchParams.get('sort')
        if (sortParam) {
            setSort(sortParam)
        }
    }, []) // Only on mount

    // Apply all filters client-side
    const filteredProducts = useMemo(() => {
        let filtered = [...initialProducts]

        // Category filter
        if (selectedCategory) {
            filtered = filtered.filter(product => 
                product.category?.slug === selectedCategory
            )
        }

        // Size filter
        if (selectedSizes.length > 0) {
            filtered = filtered.filter(product =>
                product.variants?.some(variant =>
                    variant.size && selectedSizes.includes(variant.size.toUpperCase())
                )
            )
        }

        // Color filter
        if (selectedColors.length > 0) {
            filtered = filtered.filter(product =>
                product.variants?.some(variant =>
                    variant.color && selectedColors.includes(variant.color.toLowerCase())
                )
            )
        }

        // Price filter
        filtered = filtered.filter(product => {
            const price = Number(product.price)
            return price >= priceRange[0] && price <= priceRange[1]
        })

        // Sort
        const sorted = [...filtered]
        switch (sort) {
            case "price-asc":
                sorted.sort((a, b) => Number(a.price) - Number(b.price))
                break
            case "price-desc":
                sorted.sort((a, b) => Number(b.price) - Number(a.price))
                break
            case "name-asc":
                sorted.sort((a, b) => a.name.localeCompare(b.name))
                break
            case "created_at-desc":
            default:
                sorted.sort((a, b) => {
                    const aDate = a.created_at ? new Date(a.created_at as any).getTime() : 0
                    const bDate = b.created_at ? new Date(b.created_at as any).getTime() : 0
                    return bDate - aDate
                })
                break
        }

        return sorted
    }, [initialProducts, selectedCategory, selectedSizes, selectedColors, priceRange, sort])

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
                                onCategoryChange={setSelectedCategory}
                            />
                            <SizeFilter 
                                categorySlug={selectedCategory}
                                selectedSizes={selectedSizes}
                                onSizesChange={setSelectedSizes}
                            />
                            <AdvancedFilters 
                                minPrice={calculatedMinPrice}
                                maxPrice={calculatedMaxPrice}
                                selectedColors={selectedColors}
                                onColorsChange={setSelectedColors}
                                priceRange={priceRange}
                                onPriceRangeChange={setPriceRange}
                                sort={sort}
                                onSortChange={setSort}
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
                                    Browse our collection of products
                                </p>
                            </div>
                        </div>

                        <Separator className="opacity-50" />
                    </div>

                    <ClientProductFilter 
                        initialProducts={filteredProducts}
                        categories={categories}
                    />
                </main>
            </div>
        </div>
    )
}
