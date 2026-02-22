'use client'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Sorting } from './Sorting'
import { PriceFilter } from './PriceFilter'

interface AdvancedFiltersProps {
    minPrice?: number
    maxPrice?: number
    priceRange?: [number, number]
    onPriceRangeChange?: (range: [number, number]) => void
    sort?: string
    onSortChange?: (sort: string) => void
}

export function AdvancedFilters({ 
    minPrice = 0, 
    maxPrice = 1000,
    priceRange,
    onPriceRangeChange,
    sort,
    onSortChange,
}: AdvancedFiltersProps) {
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
                                <Sorting value={sort} onChange={onSortChange} />
                            </div>
                        </div>
                        
                        <PriceFilter 
                            minPrice={minPrice}
                            maxPrice={maxPrice}
                            value={priceRange}
                            onChange={onPriceRangeChange}
                        />
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    )
}
