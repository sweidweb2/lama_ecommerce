'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

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

/**
 * Capitalize first letter of each word in a string
 */
function capitalizeColor(color: string): string {
    return color
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
}

interface VariantFiltersProps {
    value?: string[]
    onChange?: (colors: string[]) => void
    availableColors?: string[]
}

export function VariantFilters({ value, onChange, availableColors = [] }: VariantFiltersProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const [localColors, setLocalColors] = useState<string[]>([])

    // Sync from URL if not controlled
    useEffect(() => {
        if (value === undefined) {
            const colorsParam = searchParams.get('colors')
            if (!colorsParam) {
                setLocalColors([])
            } else {
                setLocalColors(
                    colorsParam
                        .split(',')
                        .map((c) => c.trim().toLowerCase())
                        .filter(Boolean),
                )
            }
        }
    }, [searchParams, value])

    const selectedColors = value !== undefined ? value : localColors

    // If no available colors provided, don't render
    if (availableColors.length === 0) {
        return null
    }

    const toggleColor = (color: string) => {
        const normalized = color.toLowerCase()
        const newColors = selectedColors.includes(normalized)
            ? selectedColors.filter((c) => c !== normalized)
            : [...selectedColors, normalized]

        if (onChange) {
            onChange(newColors)
        } else {
            setLocalColors(newColors)
            updateURL(newColors)
        }
    }

    const updateURL = (colors: string[]) => {
        const params = new URLSearchParams(searchParams.toString())

        if (colors.length === 0) {
            params.delete('colors')
        } else {
            params.set('colors', colors.join(','))
        }

        // Reset page when filtering
        params.delete('page')
        router.push(`/products?${params.toString()}`)
    }

    const handleClearAll = () => {
        if (onChange) {
            onChange([])
        } else {
            setLocalColors([])
            const params = new URLSearchParams(searchParams.toString())
            params.delete('colors')
            params.delete('page')
            router.push(`/products?${params.toString()}`)
        }
    }

    const hasActive = selectedColors.length > 0

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
                    {availableColors.map((color) => {
                        const normalized = color.toLowerCase()
                        const isSelected = selectedColors.includes(normalized)
                        const colorValue = getColorValue(color)
                        const displayName = capitalizeColor(color)

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
                                <span className="truncate">{displayName}</span>
                            </button>
                        )
                    })}
                </div>
            </div>

        </div>
    )
}
