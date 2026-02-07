'use client'

import { useState, useMemo, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useProductVariant } from './ProductVariantProvider'
import type { ProductVariant } from '@/types/product_utf8'

interface ProductVariantSelectorProps {
  variants: ProductVariant[]
  productId: string
}

/**
 * ProductVariantSelector Component
 * 
 * Maps to: customised_products table
 *          Attributes: color, size, material
 * 
 * Features:
 * - Dynamic attribute extraction from variants
 * - Multi-attribute selection (color, size, material)
 * - Stock-aware selection (disabled when out of stock)
 * - Validates variant combinations
 */
export function ProductVariantSelector({
  variants,
  productId,
}: ProductVariantSelectorProps) {
  const { setSelectedVariantId } = useProductVariant()
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null)

  // Extract unique attribute values
  const colors = useMemo(() => {
    return Array.from(new Set(variants.map((v) => v.color).filter(Boolean))) as string[]
  }, [variants])

  const sizes = useMemo(() => {
    return Array.from(new Set(variants.map((v) => v.size).filter(Boolean))) as string[]
  }, [variants])

  const materials = useMemo(() => {
    return Array.from(new Set(variants.map((v) => v.material).filter(Boolean))) as string[]
  }, [variants])

  // Find matching variant based on selections
  const selectedVariant = useMemo(() => {
    return variants.find((v) => {
      const colorMatch = !selectedColor || v.color === selectedColor
      const sizeMatch = !selectedSize || v.size === selectedSize
      const materialMatch = !selectedMaterial || v.material === selectedMaterial
      return colorMatch && sizeMatch && materialMatch
    })
  }, [variants, selectedColor, selectedSize, selectedMaterial])

  // Check if a variant option is available
  const isOptionAvailable = (type: 'color' | 'size' | 'material', value: string) => {
    return variants.some((v) => {
      const matchesType = v[type] === value
      const matchesOtherSelections =
        (!selectedColor || v.color === selectedColor || type === 'color') &&
        (!selectedSize || v.size === selectedSize || type === 'size') &&
        (!selectedMaterial || v.material === selectedMaterial || type === 'material')
      return matchesType && matchesOtherSelections && v.quantity_stock > 0
    })
  }

  const handleAttributeChange = (
    type: 'color' | 'size' | 'material',
    value: string
  ) => {
    if (type === 'color') setSelectedColor(value)
    if (type === 'size') setSelectedSize(value)
    if (type === 'material') setSelectedMaterial(value)
  }

  // Update selected variant ID in context
  useEffect(() => {
    if (selectedVariant) {
      setSelectedVariantId(selectedVariant.id)
    }
  }, [selectedVariant, setSelectedVariantId])

  return (
    <div className="space-y-6">
      {/* Color Selection */}
      {colors.length > 0 && (
        <div className="space-y-3">
          <Label className="text-base font-semibold">Color</Label>
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => {
              const isAvailable = isOptionAvailable('color', color)
              const isSelected = selectedColor === color
              return (
                <Button
                  key={color}
                  type="button"
                  variant={isSelected ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleAttributeChange('color', color)}
                  disabled={!isAvailable}
                  className={cn(
                    !isAvailable && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {color}
                </Button>
              )
            })}
          </div>
        </div>
      )}

      {/* Size Selection */}
      {sizes.length > 0 && (
        <div className="space-y-3">
          <Label className="text-base font-semibold">Size</Label>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => {
              const isAvailable = isOptionAvailable('size', size)
              const isSelected = selectedSize === size
              return (
                <Button
                  key={size}
                  type="button"
                  variant={isSelected ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleAttributeChange('size', size)}
                  disabled={!isAvailable}
                  className={cn(
                    !isAvailable && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {size}
                </Button>
              )
            })}
          </div>
        </div>
      )}

      {/* Material Selection */}
      {materials.length > 0 && (
        <div className="space-y-3">
          <Label className="text-base font-semibold">Material</Label>
          <div className="flex flex-wrap gap-2">
            {materials.map((material) => {
              const isAvailable = isOptionAvailable('material', material)
              const isSelected = selectedMaterial === material
              return (
                <Button
                  key={material}
                  type="button"
                  variant={isSelected ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleAttributeChange('material', material)}
                  disabled={!isAvailable}
                  className={cn(
                    !isAvailable && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {material}
                </Button>
              )
            })}
          </div>
        </div>
      )}

      {/* Selected Variant Info */}
      {selectedVariant && (
        <div className="pt-4 border-t text-sm text-muted-foreground">
          <p>Selected: {selectedVariant.sku_variant || 'Variant selected'}</p>
        </div>
      )}
    </div>
  )
}
