'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Sorting } from './Sorting'
import { VariantFilters } from './VariantFilters'
import { PriceFilter } from './PriceFilter'

interface AdvancedFiltersProps {
    minPrice?: number
    maxPrice?: number
}

export function AdvancedFilters({ minPrice = 0, maxPrice = 1000 }: AdvancedFiltersProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    
    // Use provided price range or defaults
    const calculatedMinPrice = minPrice
    const calculatedMaxPrice = maxPrice
    
    // State for controlled filters
    const [sortValue, setSortValue] = useState<string>(searchParams.get('sort') || 'created_at-desc')
    const [selectedColors, setSelectedColors] = useState<string[]>([])
    const [priceRange, setPriceRange] = useState<[number, number]>([calculatedMinPrice, calculatedMaxPrice])

    // Sync from URL on mount
    useEffect(() => {
        const sortParam = searchParams.get('sort')
        if (sortParam) {
            setSortValue(sortParam)
        }

        const colorsParam = searchParams.get('colors')
        if (colorsParam) {
            setSelectedColors(
                colorsParam
                    .split(',')
                    .map(c => c.trim().toLowerCase())
                    .filter(Boolean)
            )
        } else {
            setSelectedColors([])
        }

        const minParam = searchParams.get('minPrice')
        const maxParam = searchParams.get('maxPrice')
        if (minParam && maxParam) {
            const min = parseFloat(minParam)
            const max = parseFloat(maxParam)
            if (!isNaN(min) && !isNaN(max)) {
                setPriceRange([min, max])
            }
        } else {
            setPriceRange([calculatedMinPrice, calculatedMaxPrice])
        }
    }, [searchParams, calculatedMinPrice, calculatedMaxPrice])

    const handleApply = () => {
        const params = new URLSearchParams(searchParams.toString())

        // Apply sort
        if (sortValue && sortValue !== 'created_at-desc') {
            params.set('sort', sortValue)
        } else {
            params.delete('sort')
        }

        // Apply colors
        if (selectedColors.length > 0) {
            params.set('colors', selectedColors.join(','))
        } else {
            params.delete('colors')
        }

        // Apply price range
        if (priceRange[0] !== calculatedMinPrice || priceRange[1] !== calculatedMaxPrice) {
            params.set('minPrice', priceRange[0].toString())
            params.set('maxPrice', priceRange[1].toString())
        } else {
            params.delete('minPrice')
            params.delete('maxPrice')
        }

        // Reset page when applying filters
        params.delete('page')
        router.push(`/products?${params.toString()}`)
    }

    const hasChanges = () => {
        const currentSort = searchParams.get('sort') || 'created_at-desc'
        const currentColors = searchParams.get('colors')?.split(',').map(c => c.trim().toLowerCase()).filter(Boolean) || []
        const currentMinPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : calculatedMinPrice
        const currentMaxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : calculatedMaxPrice

        return (
            currentSort !== sortValue ||
            JSON.stringify([...currentColors].sort()) !== JSON.stringify([...selectedColors].sort()) ||
            currentMinPrice !== priceRange[0] ||
            currentMaxPrice !== priceRange[1]
        )
    }

    return (
        <Accordion type="single" collapsible defaultValue="item-1" className="w-full">
            <AccordionItem value="item-1" className="border-none">
                <AccordionTrigger className="text-sm font-semibold uppercase tracking-wider py-2 hover:no-underline">
                    Advanced Filters
                </AccordionTrigger>
                <AccordionContent>
                    <div className="space-y-6 pt-2">
                        <div className="space-y-4">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sort & Filter</h3>
                            <div className="flex flex-col gap-3">
                                <Sorting value={sortValue} onChange={setSortValue} />
                            </div>
                        </div>
                        
                        <VariantFilters value={selectedColors} onChange={setSelectedColors} />
                        
                        <PriceFilter 
                            minPrice={calculatedMinPrice}
                            maxPrice={calculatedMaxPrice}
                            value={priceRange}
                            onChange={setPriceRange}
                        />

                        <Button 
                            onClick={handleApply}
                            className="w-full"
                            disabled={!hasChanges()}
                        >
                            Apply Filters
                        </Button>
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    )
}
