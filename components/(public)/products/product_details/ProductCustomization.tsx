'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Heart } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useProductVariant } from './ProductVariantProvider'
import { addItemToCartAction } from '@/actions/cart'
import type { ProductVariant } from '@/types/product_utf8'

interface ProductCustomizationProps {
  productId: string
  variants: ProductVariant[]
}

// Color mapping for visual color swatches
const COLOR_MAP: Record<string, string> = {
  'Red': '#EF4444',
  'Blue': '#3B82F6',
  'Green': '#10B981',
  'Yellow': '#F59E0B',
  'Black': '#000000',
  'White': '#FFFFFF',
  'Gray': '#6B7280',
  'Grey': '#6B7280',
  'Purple': '#8B5CF6',
  'Pink': '#EC4899',
  'Orange': '#F97316',
  'Brown': '#92400E',
  'Navy': '#1E3A8A',
  'Beige': '#F5F5DC',
  'Tan': '#D2B48C',
}

/**
 * ProductCustomization Component
 * 
 * Maps to: customised_products table
 * 
 * Features:
 * - Color palette selection (visual swatches)
 * - Size selection
 * - Quantity selector
 * - Add to cart functionality
 * - Stock validation
 */
export function ProductCustomization({
  productId,
  variants,
}: ProductCustomizationProps) {
  const { setSelectedVariantId } = useProductVariant()
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  // Ref to prevent double-click - faster than state updates
  const isProcessingRef = useRef(false)

  // Extract unique attribute values
  const colors = useMemo(() => {
    return Array.from(new Set(variants.map((v) => v.color).filter(Boolean))) as string[]
  }, [variants])

  const sizes = useMemo(() => {
    return Array.from(new Set(variants.map((v) => v.size).filter(Boolean))) as string[]
  }, [variants])

  // Find matching variant based on selections
  // Require color selection if colors exist, require size selection if sizes exist
  const selectedVariant = useMemo(() => {
    // Check if all required selections are made
    const hasRequiredColor = colors.length === 0 || selectedColor !== null
    const hasRequiredSize = sizes.length === 0 || selectedSize !== null
    
    if (!hasRequiredColor || !hasRequiredSize) {
      return undefined
    }

    return variants.find((v) => {
      const colorMatch = colors.length === 0 || v.color === selectedColor
      const sizeMatch = sizes.length === 0 || v.size === selectedSize
      return colorMatch && sizeMatch && v.quantity_stock > 0
    })
  }, [variants, selectedColor, selectedSize, colors.length, sizes.length])

  // Check if a variant option is available (for enabling/disabling options)
  const isOptionAvailable = (type: 'color' | 'size', value: string) => {
    return variants.some((v) => {
      const matchesType = v[type] === value
      const matchesOtherSelections =
        (colors.length === 0 || !selectedColor || v.color === selectedColor || type === 'color') &&
        (sizes.length === 0 || !selectedSize || v.size === selectedSize || type === 'size')
      return matchesType && matchesOtherSelections && v.quantity_stock > 0
    })
  }

  // Allow users to change color - clicking a different color will update selection
  const handleColorChange = (color: string) => {
    // If clicking the same color, allow deselecting (toggle)
    if (selectedColor === color) {
      setSelectedColor(null)
    } else {
      setSelectedColor(color)
    }
    setQuantity(1) // Reset quantity when color changes
  }

  // Allow users to change size - clicking a different size will update selection
  const handleSizeChange = (size: string) => {
    // If clicking the same size, allow deselecting (toggle)
    if (selectedSize === size) {
      setSelectedSize(null)
    } else {
      setSelectedSize(size)
    }
    setQuantity(1) // Reset quantity when size changes
  }

  // Update selected variant ID in context
  useEffect(() => {
    if (selectedVariant) {
      setSelectedVariantId(selectedVariant.id)
    }
  }, [selectedVariant, setSelectedVariantId])

  // Check if all required selections are made
  const hasRequiredSelections = useMemo(() => {
    const hasColor = colors.length === 0 || selectedColor !== null
    const hasSize = sizes.length === 0 || selectedSize !== null
    return hasColor && hasSize
  }, [colors.length, sizes.length, selectedColor, selectedSize])

  const isAvailable = hasRequiredSelections && selectedVariant && selectedVariant.quantity_stock > 0
  const maxQuantity = selectedVariant?.quantity_stock || 0

  const handleAddToCart = async () => {
    // Double-click protection: check ref immediately (faster than state)
    if (isProcessingRef.current) {
      return // Already processing, ignore this click
    }

    if (!selectedVariant) {
      toast.error('Please select options', {
        description: 'Choose a color and size to continue.',
      })
      return
    }

    if (!isAvailable) {
      toast.error('Out of stock', {
        description: 'This variant is currently unavailable.',
      })
      return
    }

    if (quantity > maxQuantity) {
      toast.error('Insufficient stock', {
        description: `Only ${maxQuantity} units available.`,
      })
      return
    }

    // Set both ref and state immediately to prevent double-clicks
    isProcessingRef.current = true
    setIsAddingToCart(true)

    try {
      const result = await addItemToCartAction({
        customised_product_id: selectedVariant.id,
        quantity,
      })

      if (!result.success) {
        toast.error('Error', {
          description: result.error || 'Failed to add item to cart. Please try again.',
        })
        return
      }

      toast.success('Added to cart', {
        description: `${quantity} item(s) added successfully.`,
      })

      // Dispatch event to update floating cart button
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('cart-updated'))
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
      toast.error('Error', {
        description: 'Failed to add item to cart. Please try again.',
      })
    } finally {
      // Reset both ref and state
      isProcessingRef.current = false
      setIsAddingToCart(false)
    }
  }

  const handleWishlistToggle = async () => {
    if (!selectedVariant) {
      toast.error('Please select options', {
        description: 'Choose a color and size to add to wishlist.',
      })
      return
    }

    // TODO: Implement wishlist API call
    toast.success('Wishlist updated', {
      description: 'Item added to your wishlist.',
    })
  }

  return (
    <div className="space-y-6">
      {/* Color Palette Selection */}
      {colors.length > 0 && (
        <div className="space-y-3">
          <Label className="text-base font-semibold">Color</Label>
          <div className="flex flex-wrap gap-3">
            {colors.map((color) => {
              const isAvailable = isOptionAvailable('color', color)
              const isSelected = selectedColor === color
              const colorHex = COLOR_MAP[color] || '#6B7280'
              const isLightColor = color === 'White' || color === 'Beige' || color === 'Yellow'
              
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleColorChange(color)}
                  disabled={!isAvailable}
                  className={cn(
                    "relative w-12 h-12 rounded-full border-2 transition-all",
                    isSelected
                      ? "border-primary ring-2 ring-primary/20 scale-110"
                      : "border-border hover:border-primary/50",
                    !isAvailable && "opacity-50 cursor-not-allowed"
                  )}
                  style={{ backgroundColor: colorHex }}
                  aria-label={`Select color ${color}`}
                  title={color}
                >
                  {isSelected && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className={cn(
                        "w-5 h-5 rounded-full border-2",
                        isLightColor ? "border-gray-800" : "border-white"
                      )}>
                        <div className={cn(
                          "w-full h-full rounded-full",
                          isLightColor ? "bg-gray-800" : "bg-white"
                        )} />
                      </div>
                    </div>
                  )}
                  {!isAvailable && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-full h-0.5 bg-destructive rotate-45" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
          {selectedColor && (
            <p className="text-sm text-muted-foreground">Selected: {selectedColor}</p>
          )}
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
                  onClick={() => handleSizeChange(size)}
                  disabled={!isAvailable}
                  className={cn(
                    "min-w-[3rem]",
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

      {/* Quantity Selector - Show when variant is selected */}
      {selectedVariant && (
        <div className="space-y-3">
          <Label className="text-base font-semibold">Quantity</Label>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              className="h-10 w-10"
            >
              -
            </Button>
            <span className="w-16 text-center text-lg font-semibold">{quantity}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
              disabled={quantity >= maxQuantity}
              className="h-10 w-10"
            >
              +
            </Button>
            <span className="text-sm text-muted-foreground">
              ({maxQuantity} available)
            </span>
          </div>
        </div>
      )}

      {/* Stock Status */}
      {selectedVariant && (
        <div className="text-sm">
          {selectedVariant.quantity_stock > 0 ? (
            <p className="text-green-600 font-medium">
              ✓ In Stock ({selectedVariant.quantity_stock} units available)
            </p>
          ) : (
            <p className="text-red-600 font-medium">✗ Out of Stock</p>
          )}
        </div>
      )}

      {/* Add to Cart Button */}
      <Button
        size="lg"
        className="w-full h-12"
        onClick={handleAddToCart}
        disabled={!isAvailable || isAddingToCart || !hasRequiredSelections}
      >
        <ShoppingCart className="mr-2 h-5 w-5" />
        {isAddingToCart
          ? 'Adding...'
          : !hasRequiredSelections
          ? 'Select Options'
          : !isAvailable
          ? 'Out of Stock'
          : 'Add to Cart'}
      </Button>

      {/* Wishlist Button */}
      <Button
        variant="outline"
        size="lg"
        className="w-full"
        onClick={handleWishlistToggle}
        disabled={!selectedVariant}
      >
        <Heart className="mr-2 h-5 w-5" />
        Add to Wishlist
      </Button>
    </div>
  )
}
