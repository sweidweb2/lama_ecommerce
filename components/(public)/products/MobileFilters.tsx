'use client'

import { Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet'
import { CategoryFiltering } from './CategoryFiltering'
import { Sorting } from './Sorting'
import { PriceFilter } from './PriceFilter'
import { VariantFilters } from './VariantFilters'
import { SizeFilter } from './SizeFilter'
import { Category } from '@/types/product'
import { useState } from 'react'

interface MobileFiltersProps {
    categories: Category[]
    selectedCategory: string | null
    sort: string
    priceBoundsMin: number
    priceBoundsMax: number
    priceRange: [number, number]
    onCategoryChange: (category: string | null) => void
    onSortChange: (value: string) => void
    onPriceChange: (range: [number, number]) => void
    availableColors: string[]
    availableSizes: string[]
    selectedColors: string[]
    selectedSizes: string[]
    onColorsChange: (colors: string[]) => void
    onSizesChange: (sizes: string[]) => void
}

export function MobileFilters({
    categories,
    selectedCategory,
    sort,
    priceBoundsMin,
    priceBoundsMax,
    priceRange,
    onCategoryChange,
    onSortChange,
    onPriceChange,
    availableColors,
    availableSizes,
    selectedColors,
    selectedSizes,
    onColorsChange,
    onSizesChange,
}: MobileFiltersProps) {
    const [open, setOpen] = useState(false)

    const closeAnd = <T extends unknown[]>(fn: (...args: T) => void) => {
        return (...args: T) => {
            setOpen(false)
            fn(...args)
        }
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="flex md:hidden gap-2 h-10 rounded-xl px-4 border-border/50">
                    <Filter className="h-4 w-4" />
                    Filters
                </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-3xl h-[80vh] px-6 overflow-y-auto">
                <SheetHeader className="mb-6">
                    <SheetTitle className="text-left text-2xl font-bold">Refine Results</SheetTitle>
                </SheetHeader>
                <div className="pb-10 space-y-6">
                    <CategoryFiltering
                        categories={categories}
                        selectedCategory={selectedCategory}
                        onCategoryChange={closeAnd(onCategoryChange)}
                    />
                    <Sorting value={sort} onChange={closeAnd(onSortChange)} />
                    <PriceFilter
                        minPrice={priceBoundsMin}
                        maxPrice={priceBoundsMax}
                        value={priceRange}
                        onChange={closeAnd(onPriceChange)}
                    />
                    <VariantFilters
                        availableColors={availableColors}
                        value={selectedColors}
                        onChange={closeAnd(onColorsChange)}
                    />
                    <SizeFilter
                        availableSizes={availableSizes}
                        selectedSizes={selectedSizes}
                        onSizesChange={closeAnd(onSizesChange)}
                    />
                </div>
            </SheetContent>
        </Sheet>
    )
}
