'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'

interface PriceFilterProps {
    minPrice?: number
    maxPrice?: number
    value?: [number, number]
    onChange?: (value: [number, number]) => void
}

const DEFAULT_MIN = 0
const DEFAULT_MAX = 1000

export function PriceFilter({ 
    minPrice = DEFAULT_MIN, 
    maxPrice = DEFAULT_MAX,
    value,
    onChange 
}: PriceFilterProps) {
    const searchParams = useSearchParams()
    const [localValue, setLocalValue] = useState<[number, number]>([minPrice, maxPrice])

    // Initialize from URL params if available (only if not controlled)
    useEffect(() => {
        if (value === undefined) {
            const minParam = searchParams.get('minPrice')
            const maxParam = searchParams.get('maxPrice')
            
            if (minParam && maxParam) {
                const min = parseFloat(minParam)
                const max = parseFloat(maxParam)
                if (!isNaN(min) && !isNaN(max)) {
                    setLocalValue([min, max])
                }
            } else {
                setLocalValue([minPrice, maxPrice])
            }
        }
    }, [minPrice, maxPrice, searchParams, value])

    // Use controlled value if provided, otherwise use local state
    const currentValue = value !== undefined ? value : localValue

    const handleValueChange = (newValue: number[]) => {
        const newRange: [number, number] = [newValue[0], newValue[1]]
        if (onChange) {
            onChange(newRange)
        } else {
            setLocalValue(newRange)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Price Range
                </p>
            </div>
            <div className="space-y-3">
                <Slider
                    value={[currentValue[0], currentValue[1]]}
                    onValueChange={handleValueChange}
                    min={minPrice}
                    max={maxPrice}
                    step={1}
                    className="w-full"
                />
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                        ${currentValue[0].toFixed(2)}
                    </span>
                    <span className="text-muted-foreground">
                        ${currentValue[1].toFixed(2)}
                    </span>
                </div>
            </div>
        </div>
    )
}
