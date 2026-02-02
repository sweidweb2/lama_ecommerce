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
import { Category } from '@/types/product'
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

interface MobileFiltersProps {
    categories: Category[]
}

export function MobileFilters({ categories }: MobileFiltersProps) {
    const [open, setOpen] = useState(false)
    const searchParams = useSearchParams()

    // Close sheet when category changes
    useEffect(() => {
        setOpen(false)
    }, [searchParams])

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="flex md:hidden gap-2 h-10 rounded-xl px-4 border-border/50">
                    <Filter className="h-4 w-4" />
                    Filters
                </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-3xl h-[70vh] px-6">
                <SheetHeader className="mb-6">
                    <SheetTitle className="text-left text-2xl font-bold">Refine Results</SheetTitle>
                </SheetHeader>
                <div className="pb-10">
                    <CategoryFiltering categories={categories} />
                </div>
            </SheetContent>
        </Sheet>
    )
}
