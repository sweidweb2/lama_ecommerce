'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SizeFilterProps {
    availableSizes?: string[]
    selectedSizes?: string[]
    onSizesChange?: (sizes: string[]) => void
}

export function SizeFilter({
    availableSizes = [],
    selectedSizes: controlledSizes,
    onSizesChange,
}: SizeFilterProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [localSizes, setLocalSizes] = useState<string[]>([])

    const selectedSizes =
        controlledSizes !== undefined ? controlledSizes : localSizes

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
                        .map((s) => s.trim())
                        .filter(Boolean),
                )
            }
        }
    }, [searchParams, controlledSizes])

    const isSelected = (size: string) => {
        const key = size.trim().toUpperCase()
        return selectedSizes.some((s) => s.trim().toUpperCase() === key)
    }

    const updateURL = (sizes: string[]) => {
        const params = new URLSearchParams(searchParams.toString())
        if (sizes.length === 0) {
            params.delete('sizes')
        } else {
            params.set('sizes', sizes.join(','))
        }
        params.delete('page')
        router.push(`/products?${params.toString()}`)
    }

    const toggleSize = (size: string) => {
        const key = size.trim().toUpperCase()
        const alreadySelected = selectedSizes.some(
            (s) => s.trim().toUpperCase() === key,
        )
        const newSizes = alreadySelected
            ? selectedSizes.filter((s) => s.trim().toUpperCase() !== key)
            : [...selectedSizes, size.trim()]

        if (onSizesChange) {
            onSizesChange(newSizes)
        } else {
            setLocalSizes(newSizes)
            updateURL(newSizes)
        }
    }

    const handleClear = () => {
        if (onSizesChange) {
            onSizesChange([])
        } else {
            setLocalSizes([])
            updateURL([])
        }
    }

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
                    const selected = isSelected(size)

                    return (
                        <button
                            key={size}
                            type="button"
                            onClick={() => toggleSize(size)}
                            className={cn(
                                'h-8 px-3 flex items-center justify-center border rounded-lg text-xs font-semibold transition-all',
                                selected
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
