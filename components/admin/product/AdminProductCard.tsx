'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit, Trash2, Eye } from 'lucide-react'
import { ProductWithRelations } from '@/types/product'
import { formatPrice } from '@/lib/utils'
import { EditProductDialog } from './edit_form'
import { DeleteProductDialog } from './delete_dialog'
import type { AdminProduct } from './edit_form'

interface AdminProductCardProps {
  product: ProductWithRelations
}

// Convert ProductWithRelations to AdminProduct format
function toAdminProduct(product: ProductWithRelations): AdminProduct {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    slug: product.slug,
    brand_id: product.brand_id,
    category_id: product.category_id,
    sku: product.sku,
    price: product.price,
    is_featured: product.is_featured,
    is_trending: product.is_trending,
    is_active: product.is_active,
    image: product.images?.[0]?.url_image,
  }
}

export function AdminProductCard({ product }: AdminProductCardProps) {
  const primaryImage = product.images?.find((img) => img.is_primary) || product.images?.[0]
  const imageUrl = primaryImage?.url_image || '/placeholder-product.webp'
  const adminProduct = toAdminProduct(product)

  return (
    <Card className="h-full border border-border/40 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden p-0">
      <div className="relative aspect-[4/5] overflow-hidden bg-muted">
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
        />
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.is_featured && (
            <Badge className="bg-primary/90 backdrop-blur-sm text-white text-[10px] px-1.5 py-0.5 border-none" variant="secondary">
              Featured
            </Badge>
          )}
          {product.is_trending && (
            <Badge className="bg-destructive/90 backdrop-blur-sm text-[10px] px-1.5 py-0.5 border-none">
              Hot
            </Badge>
          )}
        </div>

        {/* Action Buttons */}
        <div className="absolute top-2 right-2">
          <div className="flex gap-1 bg-background/90 backdrop-blur-sm rounded-lg p-1 border border-border/40 shadow-sm">
            <div className="[&_button]:h-7 [&_button]:w-7 [&_button]:p-0">
              <EditProductDialog product={adminProduct} />
            </div>
            <div className="[&_button]:h-7 [&_button]:w-7 [&_button]:p-0">
              <DeleteProductDialog product={adminProduct} />
            </div>
            <Link href={`/admin/products/${product.id}`}>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                aria-label={`View ${product.name}`}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
      <div className="pt-3 pb-3 px-3 flex flex-col gap-0.5">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold truncate">
          {product.category?.name || 'Uncategorized'}
        </p>
        <h3 className="text-sm font-semibold text-foreground line-clamp-1">
          {product.name}
        </h3>
        <p className="text-base font-bold text-primary">
          {formatPrice(product.price)}
        </p>
      </div>
    </Card>
  )
}
