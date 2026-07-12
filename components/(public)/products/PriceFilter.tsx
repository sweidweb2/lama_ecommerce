'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Slider } from '@/components/ui/slider'

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
    const router = useRouter()
    const searchParams = useSearchParams()
    const [localValue, setLocalValue] = useState<[number, number]>(
        value ?? [minPrice, maxPrice]
    )

    useEffect(() => {
        if (value !== undefined) {
            setLocalValue(value)
            return
        }
        const minParam = searchParams.get('minPrice')
        const maxParam = searchParams.get('maxPrice')
        if (minParam && maxParam) {
            const min = parseFloat(minParam)
            const max = parseFloat(maxParam)
            if (!isNaN(min) && !isNaN(max)) {
                setLocalValue([min, max])
                return
            }
        }
        setLocalValue([minPrice, maxPrice])
    }, [minPrice, maxPrice, searchParams, value])

    const handleValueChange = (newValue: number[]) => {
        setLocalValue([newValue[0], newValue[1]])
    }

    const commitRange = (range: [number, number]) => {
        if (onChange) {
            onChange(range)
            return
        }
        const params = new URLSearchParams(searchParams.toString())
        params.set('minPrice', String(range[0]))
        params.set('maxPrice', String(range[1]))
        params.delete('page')
        router.push(`/products?${params.toString()}`)
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
                    value={[localValue[0], localValue[1]]}
                    onValueChange={handleValueChange}
                    onValueCommit={(v) => commitRange([v[0], v[1]])}
                    min={minPrice}
                    max={maxPrice}
                    step={1}
                    className="w-full"
                />
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                        ${localValue[0].toFixed(2)}
                    </span>
                    <span className="text-muted-foreground">
                        ${localValue[1].toFixed(2)}
                    </span>
                </div>
            </div>
        </div>
    )
}
