"use client"

import { useState, useMemo, useEffect } from "react"
import { ProductGrid } from './ProductGrid'
import { SearchBar } from './SearchBar'
import { MobileFilters } from './MobileFilters'
import type { ProductWithRelations, Category } from '@/types/product'

interface ClientProductFilterProps {
    initialProducts: ProductWithRelations[]
    categories: Category[]
}

export function ClientProductFilter({ initialProducts, categories }: ClientProductFilterProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const [page, setPage] = useState(1)
    const pageSize = 12

    // Reset to first page when search changes
    useEffect(() => {
        setPage(1)
    }, [searchQuery])

    // Filter products client-side based on search query only
    // Sorting and other filters are handled by the parent component
    const processedProducts = useMemo(() => {
        let data = initialProducts

        // Text search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim()
            data = data.filter((product) => {
                const nameMatch = product.name.toLowerCase().includes(query)
                const descriptionMatch = product.description?.toLowerCase().includes(query)
                const categoryMatch = product.category?.name.toLowerCase().includes(query)
                const brandMatch = product.brand?.name.toLowerCase().includes(query)
                const skuMatch = product.sku?.toLowerCase().includes(query)

                return nameMatch || descriptionMatch || categoryMatch || brandMatch || skuMatch
            })
        }

        return data
    }, [initialProducts, searchQuery])

    const totalPages = Math.max(1, Math.ceil(processedProducts.length / pageSize))
    const currentPage = Math.min(page, totalPages)

    const paginatedProducts = useMemo(() => {
        const start = (currentPage - 1) * pageSize
        return processedProducts.slice(start, start + pageSize)
    }, [processedProducts, currentPage, pageSize])

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
            <ProductGrid products={paginatedProducts} />

            {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                    </span>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1 text-sm rounded-md border border-border bg-background disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <button
                            type="button"
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
