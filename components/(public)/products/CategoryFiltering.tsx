'use client'

import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Category } from '@/types/product'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

interface CategoryFilteringProps {
    categories: Category[]
}

export function CategoryFiltering({ categories }: CategoryFilteringProps) {
    const searchParams = useSearchParams()
    const router = useRouter()
    const currentCategory = searchParams.get('category')

    const createQueryString = (name: string, value: string | null) => {
        const params = new URLSearchParams(searchParams.toString())
        if (value) {
            params.set(name, value)
        } else {
            params.delete(name)
        }
        // Reset page when filtering
        params.delete('page')
        return params.toString()
    }

    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">Categories</h3>
                <div className="flex flex-col gap-1">
                    <Button
                        variant={!currentCategory ? 'secondary' : 'ghost'}
                        className={cn(
                            "justify-start font-normal",
                            !currentCategory && "font-semibold"
                        )}
                        asChild
                    >
                        <Link href={`/products?${createQueryString('category', null)}`}>
                            All Products
                        </Link>
                    </Button>
                    {categories.map((category) => (
                        <Button
                            key={category.id}
                            variant={currentCategory === category.slug ? 'secondary' : 'ghost'}
                            className={cn(
                                "justify-start font-normal",
                                currentCategory === category.slug && "font-semibold"
                            )}
                            asChild
                        >
                            <Link href={`/products?${createQueryString('category', category.slug)}`}>
                                {category.name}
                            </Link>
                        </Button>
                    ))}
                </div>
            </div>
        </div>
    )
}
