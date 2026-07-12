'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Category } from '@/types/product'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface CategoryFilteringProps {
    categories: Category[]
    selectedCategory?: string | null
    onCategoryChange?: (category: string | null) => void
}

export function CategoryFiltering({ 
    categories, 
    selectedCategory, 
    onCategoryChange 
}: CategoryFilteringProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const handleCategoryClick = (categorySlug: string | null) => {
        if (onCategoryChange) {
            onCategoryChange(categorySlug)
            return
        }
        const params = new URLSearchParams(searchParams.toString())
        if (categorySlug) params.set('category', categorySlug)
        else params.delete('category')
        params.delete('page')
        const qs = params.toString()
        router.push(qs ? `/products?${qs}` : '/products')
    }

    return (
        <div className="space-y-4">
            <div>
                <label htmlFor="category-filter" className="text-sm font-semibold uppercase tracking-wider mb-4 block">
                    Category
                </label>
                <h3 className="sr-only">Categories</h3>
                <div id="category-filter" className="flex flex-col gap-1" role="list" aria-label="Product categories">
                    <Button
                        variant={!selectedCategory ? 'secondary' : 'ghost'}
                        className={cn(
                            "justify-start font-normal",
                            !selectedCategory && "font-semibold"
                        )}
                        onClick={() => handleCategoryClick(null)}
                        role="listitem"
                    >
                        All Products
                    </Button>
                    {categories.map((category) => (
                        <Button
                            key={category.id}
                            variant={selectedCategory === category.slug ? 'secondary' : 'ghost'}
                            className={cn(
                                "justify-start font-normal",
                                selectedCategory === category.slug && "font-semibold"
                            )}
                            onClick={() => handleCategoryClick(category.slug)}
                            role="listitem"
                        >
                            {category.name}
                        </Button>
                    ))}
                </div>
            </div>
        </div>
    )
}
