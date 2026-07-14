'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
    getColorLabel,
    getColorSwatch,
    normalizeColorValue,
} from '@/lib/constants/color-palette'

interface VariantFiltersProps {
    value?: string[]
    onChange?: (colors: string[]) => void
    availableColors?: string[]
}

export function VariantFilters({
    value,
    onChange,
    availableColors = [],
}: VariantFiltersProps) {
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
                        .map((c) => normalizeColorValue(c))
                        .filter(Boolean),
                )
            }
        }
    }, [searchParams, value])

    const selectedColors = value !== undefined ? value : localColors

    if (availableColors.length === 0) {
        return null
    }

    const isSelected = (color: string) => {
        const key = normalizeColorValue(color).toUpperCase()
        return selectedColors.some(
            (c) => normalizeColorValue(c).toUpperCase() === key,
        )
    }

    const toggleColor = (color: string) => {
        const normalized = normalizeColorValue(color)
        const key = normalized.toUpperCase()
        const alreadySelected = selectedColors.some(
            (c) => normalizeColorValue(c).toUpperCase() === key,
        )
        const newColors = alreadySelected
            ? selectedColors.filter(
                  (c) => normalizeColorValue(c).toUpperCase() !== key,
              )
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
            params.set('colors', colors.map(normalizeColorValue).join(','))
        }

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
                        const selected = isSelected(color)
                        const displayName = getColorLabel(color)
                        const swatch = getColorSwatch(color)

                        return (
                            <button
                                key={color}
                                type="button"
                                onClick={() => toggleColor(color)}
                                className={cn(
                                    'flex items-center gap-2 px-2 py-1.5 border rounded-lg text-xs font-medium transition-all',
                                    selected
                                        ? 'border-primary bg-primary/5'
                                        : 'border-border bg-background hover:border-primary/60',
                                )}
                            >
                                <span
                                    className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                                    style={{ backgroundColor: swatch }}
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
