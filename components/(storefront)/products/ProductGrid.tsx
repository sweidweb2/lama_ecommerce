'use client'

import { ProductWithRelations } from '@/types/product'
import { ProductCard } from '@/components/common/ProductCard'

interface ProductGridProps {
    products: ProductWithRelations[]
}

export function ProductGrid({ products }: ProductGridProps) {
    if (products.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <h3 className="text-xl font-semibold">No products found</h3>
                <p className="text-muted-foreground mt-2">
                    Try adjusting your filters or search criteria.
                </p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
                <ProductCard key={product.id} product={product} />
            ))}
        </div>
    )
}
