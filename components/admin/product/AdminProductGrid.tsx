'use client'

import { ProductWithRelations } from '@/types/product'
import type { Brand, Category } from '@/types/product'
import { AdminProductCard } from './AdminProductCard'

interface AdminProductGridProps {
  products: (ProductWithRelations & { encryptedId?: string })[]
  brands: Brand[]
  categories: Category[]
}

export function AdminProductGrid({ products, brands, categories }: AdminProductGridProps) {
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
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 md:gap-6">
      {products.map((product) => (
        <AdminProductCard 
          key={product.id} 
          product={product}
          brands={brands}
          categories={categories}
        />
      ))}
    </div>
  )
}
