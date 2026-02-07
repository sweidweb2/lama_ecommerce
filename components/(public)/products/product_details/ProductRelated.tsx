import Link from 'next/link'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/utils'
import type { ProductWithRelations } from '@/types/product_utf8'

interface ProductRelatedProps {
  products: ProductWithRelations[]
}

/**
 * ProductRelated Component
 * 
 * Maps to: products table (related by category_id)
 * 
 * Displays:
 * - Related products from same category
 * - Product cards with images, names, prices
 * - Links to product detail pages
 */
export function ProductRelated({ products }: ProductRelatedProps) {
  if (products.length === 0) return null

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Related Products</h2>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {products.map((product) => {
          const primaryImage = product.images?.find((img) => img.is_primary) || product.images?.[0]
          const imageUrl = primaryImage?.url_image || '/placeholder-product.webp'

          return (
            <Link
              key={product.id}
              href={`/products/${product.slug}`}
              className="group"
            >
              <Card className="overflow-hidden transition-all hover:shadow-lg p-0">
                <div className="relative aspect-square overflow-hidden bg-muted">
                  <Image
                    src={imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
                  />
                  {product.is_featured && (
                    <Badge className="absolute top-1 left-1 text-[10px] px-1.5 py-0.5">
                      Featured
                    </Badge>
                  )}
                </div>
                <div className="p-2 sm:p-3 space-y-1">
                  <h3 className="text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-base font-bold text-primary">
                    {formatPrice(product.price)}
                  </p>
                </div>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
