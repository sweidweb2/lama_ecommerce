'use client'

import { useMemo } from 'react'
import { formatPrice } from '@/lib/utils'
import { useProductVariant } from './ProductVariantProvider'
import type { ProductVariant } from '@/types/product'

interface ProductPricingProps {
  basePrice: number
  variants: ProductVariant[]
}

/**
 * ProductPricing Component
 * 
 * Maps to: products.price (base price)
 *          customised_products.price_override (variant-specific pricing)
 * 
 * Pricing Logic:
 * - If variant has price_override, use that
 * - Otherwise, use base product price
 * - Supports future discount/promo code integration
 */
export function ProductPricing({
  basePrice,
  variants,
}: ProductPricingProps) {
  const { selectedVariantId } = useProductVariant()
  
  const displayPrice = useMemo(() => {
    if (selectedVariantId) {
      const variant = variants.find((v) => v.id === selectedVariantId)
      if (variant?.price_override !== null && variant?.price_override !== undefined) {
        return variant.price_override
      }
    }
    return basePrice
  }, [basePrice, variants, selectedVariantId])

  // Check if there's a price difference
  const hasPriceVariation = variants.some(
    (v) => v.price_override !== null && v.price_override !== basePrice
  )

  return (
    <div className="space-y-2">
      <div className="flex items-baseline gap-3">
        <span className="text-4xl font-bold">{formatPrice(displayPrice)}</span>
        {hasPriceVariation && (
          <span className="text-sm text-muted-foreground">
            (varies by variant)
          </span>
        )}
      </div>
      
      {/* Future: Discount display */}
      {/* {discount && (
        <div className="flex items-center gap-2">
          <span className="text-lg text-muted-foreground line-through">
            {formatPrice(originalPrice)}
          </span>
          <Badge variant="destructive">Save {discount}%</Badge>
        </div>
      )} */}
    </div>
  )
}
