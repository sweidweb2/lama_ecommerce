'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const AVAILABLE_COLORS = [
    'Red',
    'Blue',
    'Green',
    'Yellow',
    'Black',
    'White',
    'Gray',
    'Purple',
    'Pink',
    'Orange',
    'Brown',
    'Navy',
    'Beige',
    'Tan',
]

const AVAILABLE_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL']

function getColorValue(colorName: string): string {
    const colorMap: Record<string, string> = {
        red: '#ef4444',
        blue: '#3b82f6',
        green: '#22c55e',
        yellow: '#eab308',
        black: '#000000',
        white: '#ffffff',
        gray: '#6b7280',
        grey: '#6b7280',
        purple: '#a855f7',
        pink: '#ec4899',
        orange: '#f97316',
        brown: '#92400e',
        navy: '#1e3a8a',
        beige: '#f5f5dc',
        tan: '#d2b48c',
    }

    const normalized = colorName.toLowerCase().trim()
    return colorMap[normalized] || '#6b7280'
}

export function VariantFilters() {
    const router = useRouter()
    const searchParams = useSearchParams()

    const [selectedColors, setSelectedColors] = useState<string[]>([])
    const [selectedSizes, setSelectedSizes] = useState<string[]>([])

    // Sync from URL
    useEffect(() => {
        const colorsParam = searchParams.get('colors')
        if (!colorsParam) {
            setSelectedColors([])
        } else {
            setSelectedColors(
                colorsParam
                    .split(',')
                    .map((c) => c.trim().toLowerCase())
                    .filter(Boolean),
            )
        }

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

    const toggleColor = (color: string) => {
        const normalized = color.toLowerCase()
        const newColors = selectedColors.includes(normalized)
            ? selectedColors.filter((c) => c !== normalized)
            : [...selectedColors, normalized]

        setSelectedColors(newColors)
        updateURL(newColors, selectedSizes)
    }

    const toggleSize = (size: string) => {
        const normalized = size.toUpperCase()
        const newSizes = selectedSizes.includes(normalized)
            ? selectedSizes.filter((s) => s !== normalized)
            : [...selectedSizes, normalized]

        setSelectedSizes(newSizes)
        updateURL(selectedColors, newSizes)
    }

    const updateURL = (colors: string[], sizes: string[]) => {
        const params = new URLSearchParams(searchParams.toString())

        if (colors.length === 0) {
            params.delete('colors')
        } else {
            params.set('colors', colors.join(','))
        }

        if (sizes.length === 0) {
            params.delete('sizes')
        } else {
            params.set('sizes', sizes.join(','))
        }

        // Reset page when filtering
        params.delete('page')
        router.push(`/products?${params.toString()}`)
    }

    const handleClearAll = () => {
        setSelectedColors([])
        setSelectedSizes([])

        const params = new URLSearchParams(searchParams.toString())
        params.delete('colors')
        params.delete('sizes')
        params.delete('page')
        router.push(`/products?${params.toString()}`)
    }

    const hasActive = selectedColors.length > 0 || selectedSizes.length > 0

    return (
        <div className="space-y-4">
            {/* Colors */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        Colors
                    </p>
                    {hasActive && (
                        <Button
                            variant="ghost"
                            size="sm"
                            type="button"
                            onClick={handleClearAll}
                            className="h-6 text-xs px-2"
                        >
                            Clear
                        </Button>
                    )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                    {AVAILABLE_COLORS.map((color) => {
                        const normalized = color.toLowerCase()
                        const isSelected = selectedColors.includes(normalized)
                        const colorValue = getColorValue(color)

                        return (
                            <button
                                key={color}
                                type="button"
                                onClick={() => toggleColor(color)}
                                className={cn(
                                    'flex items-center gap-2 px-2 py-1.5 border rounded-lg text-xs font-medium transition-all',
                                    isSelected
                                        ? 'border-primary bg-primary/5'
                                        : 'border-border bg-background hover:border-primary/60',
                                )}
                            >
                                <span
                                    className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                                    style={{
                                        backgroundColor: colorValue,
                                    }}
                                />
                                <span className="truncate">{color}</span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Sizes */}
            <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Sizes
                </p>
                <div className="flex flex-wrap gap-2">
                    {AVAILABLE_SIZES.map((size) => {
                        const normalized = size.toUpperCase()
                        const isSelected = selectedSizes.includes(normalized)

                        return (
                            <button
                                key={size}
                                type="button"
                                onClick={() => toggleSize(size)}
                                className={cn(
                                    'w-10 h-8 flex items-center justify-center border rounded-lg text-xs font-semibold transition-all',
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
        </div>
    )
}
