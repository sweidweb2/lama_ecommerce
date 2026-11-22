import Link from "@/components/ui/link"
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { Category, Brand } from '@/types/product'

interface ProductCoreInfoProps {
  name: string
  description: string | null
  category: Category | undefined
  brand: Brand | undefined
  isFeatured?: boolean
  isTrending?: boolean
}

/**
 * ProductCoreInfo Component
 * 
 * Maps to: products table (name, description)
 *          categories table (category relationship)
 *          brands table (brand relationship)
 * 
 * Displays:
 * - Product name
 * - Category breadcrumb link
 * - Brand information
 * - Description
 * - Status badges
 */
export function ProductCoreInfo({
  name,
  description,
  category,
  brand,
  isFeatured,
  isTrending,
}: ProductCoreInfoProps) {
  return (
    <div className="space-y-4">
      {/* Category Link */}
      {category && (
        <div>
          <Link
            href={`/products?category=${category.slug}`}
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            {category.name}
          </Link>
        </div>
      )}

      {/* Product Name */}
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{name}</h1>

      {/* Brand */}
      {brand && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Brand:</span>
          <Link
            href={`/products?brand=${brand.slug}`}
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            {brand.name}
          </Link>
        </div>
      )}

      {/* Status Badges */}
      {(isFeatured || isTrending) && (
        <div className="flex flex-wrap gap-2">
          {isFeatured && (
            <Badge variant="default" className="text-xs">
              Featured
            </Badge>
          )}
          {isTrending && (
            <Badge variant="destructive" className="text-xs">
              Trending
            </Badge>
          )}
        </div>
      )}

      <Separator />

      {/* Description */}
      {description && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Description</h2>
          <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
            {description}
          </p>
        </div>
      )}
    </div>
  )
}
