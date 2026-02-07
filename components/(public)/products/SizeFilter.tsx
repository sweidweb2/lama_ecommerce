'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Category-specific size mappings
const CATEGORY_SIZES: Record<string, string[]> = {
    'electronics': [], // Electronics typically don't have sizes
    'fashion': ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'], // Standard clothing sizes
    'home-garden': ['Small', 'Medium', 'Large'], // Home items might have generic sizes
    'beauty': [], // Beauty products typically don't have sizes
    'sports': ['XS', 'S', 'M', 'L', 'XL', 'XXL'], // Sportswear sizes
    'toys': ['Small', 'Medium', 'Large'], // Toys might have generic sizes
}

// Default sizes when no category is selected
const DEFAULT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL']

interface SizeFilterProps {
    categorySlug?: string | null
}

export function SizeFilter({ categorySlug }: SizeFilterProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const [selectedSizes, setSelectedSizes] = useState<string[]>([])

    // Get available sizes based on category
    const availableSizes = categorySlug 
        ? (CATEGORY_SIZES[categorySlug] || DEFAULT_SIZES)
        : DEFAULT_SIZES

    // Sync from URL
    useEffect(() => {
        const sizesParam = searchParams.get('sizes')
        if (!sizesParam) {
            setSelectedSizes([])
        } else {
            setSelectedSizes(
                sizesParam
                    .split(',')
                    .map((s) => s.trim().toUpperCase())
                    .filter(Boolean),
            )
        }
    }, [searchParams])

    const toggleSize = (size: string) => {
        const normalized = size.toUpperCase()
        const newSizes = selectedSizes.includes(normalized)
            ? selectedSizes.filter((s) => s !== normalized)
            : [...selectedSizes, normalized]

        setSelectedSizes(newSizes)
        updateURL(newSizes)
    }

    const updateURL = (sizes: string[]) => {
        const params = new URLSearchParams(searchParams.toString())

        if (sizes.length === 0) {
            params.delete('sizes')
        } else {
            params.set('sizes', sizes.join(','))
        }

        // Reset page when filtering
        params.delete('page')
        router.push(`/products?${params.toString()}`)
    }

    const handleClear = () => {
        setSelectedSizes([])
        const params = new URLSearchParams(searchParams.toString())
        params.delete('sizes')
        params.delete('page')
        router.push(`/products?${params.toString()}`)
    }

    // Don't render if no sizes available for this category
    if (availableSizes.length === 0) {
        return null
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Sizes
                </p>
                {selectedSizes.length > 0 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        onClick={handleClear}
                        className="h-6 text-xs px-2"
                    >
                        Clear
                    </Button>
                )}
            </div>
            <div className="flex flex-wrap gap-2">
                {availableSizes.map((size) => {
                    const normalized = size.toUpperCase()
                    const isSelected = selectedSizes.includes(normalized)

                    return (
                        <button
                            key={size}
                            type="button"
                            onClick={() => toggleSize(size)}
                            className={cn(
                                'h-8 px-3 flex items-center justify-center border rounded-lg text-xs font-semibold transition-all',
                                isSelected
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border bg-background hover:border-primary/60',
                            )}
                        >
                            {size}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
