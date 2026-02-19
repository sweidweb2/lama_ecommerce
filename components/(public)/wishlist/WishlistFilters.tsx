'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { X } from 'lucide-react'
import { DUMMY_CATEGORIES } from '@/lib/constants/dummy-data'

export function WishlistFilters() {
    const router = useRouter()
    const searchParams = useSearchParams()

    const category = searchParams.get('category') || 'all'
    const featured = searchParams.get('featured') || 'all'
    const trending = searchParams.get('trending') || 'all'
    const priceRange = searchParams.get('priceRange') || 'all'

    const createQueryString = (name: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (value === 'all') {
            params.delete(name)
        } else {
            params.set(name, value)
        }
        // Reset page when filtering
        params.delete('page')
        return params.toString()
    }

    const handleFilterChange = (name: string, value: string) => {
        const queryString = createQueryString(name, value)
        router.push(`/wishlist?${queryString}`)
    }

    const hasActiveFilters =
        category !== 'all' ||
        featured !== 'all' ||
        trending !== 'all' ||
        priceRange !== 'all'

    const clearFilters = () => {
        router.push('/wishlist')
    }

    return (
        <div className="flex flex-wrap items-center gap-4 mb-8">
            {hasActiveFilters && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-muted-foreground h-9"
                >
                    <X className="h-4 w-4 mr-1" />
                    Clear Filters
                </Button>
            )}
            <Select value={category} onValueChange={(value) => handleFilterChange('category', value)}>
                <SelectTrigger id="category-filter" className="h-9 w-[160px]">
                    <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {DUMMY_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.id} value={cat.slug || cat.id}>
                            {cat.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select value={priceRange} onValueChange={(value) => handleFilterChange('priceRange', value)}>
                <SelectTrigger id="price-range-filter" className="h-9 w-[160px]">
                    <SelectValue placeholder="All Prices" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Prices</SelectItem>
                    <SelectItem value="0-50">$0 - $50</SelectItem>
                    <SelectItem value="50-100">$50 - $100</SelectItem>
                    <SelectItem value="100-200">$100 - $200</SelectItem>
                    <SelectItem value="200-500">$200 - $500</SelectItem>
                    <SelectItem value="500+">$500+</SelectItem>
                </SelectContent>
            </Select>

            <Select value={featured} onValueChange={(value) => handleFilterChange('featured', value)}>
                <SelectTrigger id="featured-filter" className="h-9 w-[140px]">
                    <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="true">Featured Only</SelectItem>
                    <SelectItem value="false">Not Featured</SelectItem>
                </SelectContent>
            </Select>

            <Select value={trending} onValueChange={(value) => handleFilterChange('trending', value)}>
                <SelectTrigger id="trending-filter" className="h-9 w-[140px]">
                    <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="true">Trending Only</SelectItem>
                    <SelectItem value="false">Not Trending</SelectItem>
                </SelectContent>
            </Select>
        </div>
    )
}
