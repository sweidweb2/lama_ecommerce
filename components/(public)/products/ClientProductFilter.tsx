'use client'

import { useState, useMemo } from 'react'
import { ProductGrid } from './ProductGrid'
import { SearchBar } from './SearchBar'
import { MobileFilters } from './MobileFilters'
import type { ProductWithRelations, Category } from '@/types/product'

interface ClientProductFilterProps {
    initialProducts: ProductWithRelations[]
    categories: Category[]
}

export function ClientProductFilter({ initialProducts, categories }: ClientProductFilterProps) {
    const [searchQuery, setSearchQuery] = useState('')

    // Filter products client-side based on search query
    const filteredProducts = useMemo(() => {
        if (!searchQuery.trim()) {
            return initialProducts
        }

        const query = searchQuery.toLowerCase().trim()
        return initialProducts.filter(product => {
            const nameMatch = product.name.toLowerCase().includes(query)
            const descriptionMatch = product.description?.toLowerCase().includes(query)
            const categoryMatch = product.category?.name.toLowerCase().includes(query)
            const brandMatch = product.brand?.name.toLowerCase().includes(query)
            const skuMatch = product.sku?.toLowerCase().includes(query)

            return nameMatch || descriptionMatch || categoryMatch || brandMatch || skuMatch
        })
    }, [initialProducts, searchQuery])

    return (
        <>
            <div className="w-full md:w-auto flex flex-col sm:flex-row items-center gap-4 bg-muted/30 p-2 rounded-xl border border-border/50 backdrop-blur-sm">
                <div className="w-full flex items-center gap-2 md:gap-4">
                    <div className="flex-1">
                        <SearchBar onSearchChange={setSearchQuery} />
                    </div>
                    <MobileFilters categories={categories} />
                </div>
            </div>
            <ProductGrid products={filteredProducts} />
        </>
    )
}
