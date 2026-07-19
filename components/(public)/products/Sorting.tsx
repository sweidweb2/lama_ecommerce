'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { ROUTES } from '@/lib/constants/routes'

const sortOptions = [
    { label: 'Newest', value: 'created_at-desc' },
    { label: 'Price: Low to High', value: 'price-asc' },
    { label: 'Price: High to Low', value: 'price-desc' },
    { label: 'Name: A-Z', value: 'name-asc' },
]

export const ALLOWED_SORT_VALUES = new Set(sortOptions.map((o) => o.value))
export const DEFAULT_SORT = 'created_at-desc'

interface SortingProps {
    value?: string
    onChange?: (value: string) => void
    /** Used when uncontrolled (no onChange). Defaults to catalog. */
    basePath?: string
}

export function Sorting({
    value,
    onChange,
    basePath = ROUTES.PRODUCTS,
}: SortingProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const rawSort = value !== undefined ? value : (searchParams.get('sort') || DEFAULT_SORT)
    const currentSort = ALLOWED_SORT_VALUES.has(rawSort) ? rawSort : DEFAULT_SORT

    const handleSortChange = (newValue: string) => {
        if (onChange) {
            onChange(newValue)
        } else {
            const params = new URLSearchParams(searchParams.toString())
            params.set('sort', newValue)
            params.delete('page')
            router.push(`${basePath}?${params.toString()}`)
        }
    }

    return (
        <div className="flex flex-col gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Sort by:</span>
            <Select value={currentSort} onValueChange={handleSortChange}>
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                    {sortOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}
