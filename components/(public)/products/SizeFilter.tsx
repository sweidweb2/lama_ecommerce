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
    selectedSizes?: string[]
    onSizesChange?: (sizes: string[]) => void
}

export function SizeFilter({ 
    categorySlug, 
    selectedSizes: controlledSizes,
    onSizesChange 
}: SizeFilterProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [localSizes, setLocalSizes] = useState<string[]>([])

    // Get available sizes based on category
    const availableSizes = categorySlug 
        ? (CATEGORY_SIZES[categorySlug] || DEFAULT_SIZES)
        : DEFAULT_SIZES

    // Use controlled value if provided, otherwise use local state
    const selectedSizes = controlledSizes !== undefined ? controlledSizes : localSizes

    // Sync from URL only if not controlled
    useEffect(() => {
        if (controlledSizes === undefined) {
            const sizesParam = searchParams.get('sizes')
            if (!sizesParam) {
                setLocalSizes([])
            } else {
                setLocalSizes(
                    sizesParam
                        .split(',')
                        .map((s) => s.trim().toUpperCase())
                        .filter(Boolean),
                )
            }
        }
    }, [searchParams, controlledSizes])

    const toggleSize = (size: string) => {
        const normalized = size.toUpperCase()
        const newSizes = selectedSizes.includes(normalized)
            ? selectedSizes.filter((s) => s !== normalized)
            : [...selectedSizes, normalized]

        if (onSizesChange) {
            onSizesChange(newSizes)
        } else {
            setLocalSizes(newSizes)
        }
    }

    const handleClear = () => {
        if (onSizesChange) {
            onSizesChange([])
        } else {
            setLocalSizes([])
        }
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
