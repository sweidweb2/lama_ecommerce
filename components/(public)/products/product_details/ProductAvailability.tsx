'use client'

import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useProductVariant } from './ProductVariantProvider'
import type { ProductVariant } from '@/types/product_utf8'

interface ProductAvailabilityProps {
  variants: ProductVariant[]
}

/**
 * ProductAvailability Component
 * 
 * Maps to: customised_products.quantity_stock
 * 
 * Displays:
 * - Stock status (in stock, low stock, out of stock)
 * - Available quantity
 * - Stock status per variant
 */
export function ProductAvailability({
  variants,
}: ProductAvailabilityProps) {
  const { selectedVariantId } = useProductVariant()
  const selectedVariant = selectedVariantId
    ? variants.find((v) => v.id === selectedVariantId)
    : null

  // Calculate overall stock status
  const totalStock = variants.reduce((sum, v) => sum + v.quantity_stock, 0)
  const inStockVariants = variants.filter((v) => v.quantity_stock > 0).length
  const lowStockVariants = variants.filter(
    (v) => v.quantity_stock > 0 && v.quantity_stock <= 10
  ).length

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: 'Out of Stock', variant: 'destructive' as const, icon: XCircle }
    if (stock <= 10) return { label: 'Low Stock', variant: 'secondary' as const, icon: AlertCircle }
    return { label: 'In Stock', variant: 'default' as const, icon: CheckCircle2 }
  }

  const overallStatus = totalStock > 0
    ? lowStockVariants > 0
      ? getStockStatus(10)
      : getStockStatus(totalStock)
    : getStockStatus(0)

  const StatusIcon = overallStatus.icon

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <StatusIcon className={cn(
          "h-5 w-5",
          overallStatus.variant === 'default' && "text-green-600",
          overallStatus.variant === 'secondary' && "text-yellow-600",
          overallStatus.variant === 'destructive' && "text-red-600"
        )} />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{overallStatus.label}</span>
            <Badge variant={overallStatus.variant} className="text-xs">
              {inStockVariants} of {variants.length} variants available
            </Badge>
          </div>
          {selectedVariant && (
            <p className="text-sm text-muted-foreground mt-1">
              Selected variant: {selectedVariant.quantity_stock} units available
            </p>
          )}
        </div>
      </div>

      {totalStock > 0 && (
        <p className="text-sm text-muted-foreground">
          Total stock: {totalStock} units across all variants
        </p>
      )}
    </div>
  )
}
