'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
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

function parseColorsParam(param: string | null): string[] {
    if (!param) return []
    return param
        .split(',')
        .map((c) => c.trim().toLowerCase())
        .filter(Boolean)
}

function parseSizesParam(param: string | null): string[] {
    if (!param) return []
    return param
        .split(',')
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean)
}

export function VariantFilterButton() {
    const router = useRouter()
    const searchParams = useSearchParams()

    const urlColors = parseColorsParam(searchParams.get('colors'))
    const urlSizes = parseSizesParam(searchParams.get('sizes'))

    const [open, setOpen] = useState(false)
    const [selectedColors, setSelectedColors] = useState<string[]>(urlColors)
    const [selectedSizes, setSelectedSizes] = useState<string[]>(urlSizes)

    const handleOpenChange = (nextOpen: boolean) => {
        if (nextOpen) {
            setSelectedColors(urlColors)
            setSelectedSizes(urlSizes)
        }
        setOpen(nextOpen)
    }

    const toggleColor = (color: string) => {
        const normalized = color.toLowerCase()
        setSelectedColors((prev) =>
            prev.includes(normalized)
                ? prev.filter((c) => c !== normalized)
                : [...prev, normalized],
        )
    }

    const toggleSize = (size: string) => {
        const normalized = size.toUpperCase()
        setSelectedSizes((prev) =>
            prev.includes(normalized)
                ? prev.filter((s) => s !== normalized)
                : [...prev, normalized],
        )
    }

    const handleClearAll = () => {
        setSelectedColors([])
        setSelectedSizes([])

        const params = new URLSearchParams(searchParams.toString())
        params.delete('colors')
        params.delete('sizes')
        router.push(`/products?${params.toString()}`)
        setOpen(false)
    }

    const handleApply = () => {
        const params = new URLSearchParams(searchParams.toString())

        if (selectedColors.length === 0) {
            params.delete('colors')
        } else {
            params.set('colors', selectedColors.join(','))
        }

        if (selectedSizes.length === 0) {
            params.delete('sizes')
        } else {
            params.set('sizes', selectedSizes.join(','))
        }

        router.push(`/products?${params.toString()}`)
        setOpen(false)
    }

    const hasActive = urlColors.length > 0 || urlSizes.length > 0

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <Button
                type="button"
                variant={hasActive ? 'default' : 'outline'}
                size="sm"
                className="w-full justify-between"
                onClick={() => handleOpenChange(true)}
            >
                Filters
                {hasActive && (
                    <span className="ml-2 rounded-full bg-background/80 border border-border px-2 text-xs">
                        {urlColors.length + urlSizes.length}
                    </span>
                )}
            </Button>

            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Filter by color & size</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 mt-2">
                    {/* Colors */}
                    <div className="space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                            Colors
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {AVAILABLE_COLORS.map((color) => {
                                const normalized = color.toLowerCase()
                                const isSelected =
                                    selectedColors.includes(normalized)
                                const colorValue = getColorValue(color)

                                return (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => toggleColor(color)}
                                        className={cn(
                                            'flex items-center gap-3 px-3 py-2 border rounded-xl text-sm font-medium transition-all',
                                            isSelected
                                                ? 'border-primary bg-primary/5'
                                                : 'border-border bg-background hover:border-primary/60',
                                        )}
                                    >
                                        <span
                                            className="w-6 h-6 rounded-full border border-black/10"
                                            style={{
                                                backgroundColor: colorValue,
                                            }}
                                        />
                                        <span>{color}</span>
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
                        <div className="flex flex-wrap gap-3">
                            {AVAILABLE_SIZES.map((size) => {
                                const normalized = size.toUpperCase()
                                const isSelected =
                                    selectedSizes.includes(normalized)

                                return (
                                    <button
                                        key={size}
                                        type="button"
                                        onClick={() => toggleSize(size)}
                                        className={cn(
                                            'w-14 h-10 flex items-center justify-center border rounded-xl text-sm font-semibold transition-all',
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

                <DialogFooter className="mt-6 flex justify-between sm:justify-between">
                    <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        onClick={handleClearAll}
                    >
                        Clear all
                    </Button>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            type="button"
                            onClick={handleApply}
                        >
                            Done
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
