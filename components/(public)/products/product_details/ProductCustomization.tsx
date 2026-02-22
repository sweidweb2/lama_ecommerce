'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Heart } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useProductVariant } from './ProductVariantProvider'
import { addItemToCartAction } from '@/actions/cart'
import { toggleWishlistAction, checkWishlistStatusAction } from '@/actions/wishlist'
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

// Helper function to check if a hex color is light
function isLightHexColor(hex: string): boolean {
  try {
    // Remove # if present
    let cleanHex = hex.replace('#', '')
    
    // Handle 3-character hex codes (e.g., #FFF -> #FFFFFF)
    if (cleanHex.length === 3) {
      cleanHex = cleanHex.split('').map(char => char + char).join('')
    }
    
    // Validate hex code length
    if (cleanHex.length !== 6) {
      return false
    }
    
    // Parse RGB values
    const r = parseInt(cleanHex.substring(0, 2), 16)
    const g = parseInt(cleanHex.substring(2, 4), 16)
    const b = parseInt(cleanHex.substring(4, 6), 16)
    
    // Validate parsed values
    if (isNaN(r) || isNaN(g) || isNaN(b)) {
      return false
    }
    
    // Calculate luminance (using relative luminance formula)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    
    // Consider light if luminance is greater than 0.5
    return luminance > 0.5
  } catch {
    return false
  }
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
  const [showColorAlert, setShowColorAlert] = useState(false)
  const [showSizeAlert, setShowSizeAlert] = useState(false)
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
      // We intentionally DO NOT filter by stock here so we can
      // show a clear \"Out of stock\" state for the selected variant.
      return colorMatch && sizeMatch
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
    setShowColorAlert(false) // Clear alert when color is selected
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
    setShowSizeAlert(false) // Clear alert when size is selected
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

    // Check for required selections and show awareness messages
    if (!hasRequiredSelections) {
      if (colors.length > 0 && !selectedColor) {
        setShowColorAlert(true)
      }
      if (sizes.length > 0 && !selectedSize) {
        setShowSizeAlert(true)
      }
      return
    }

    if (!selectedVariant) {
      toast.error('Please select options', {
        description: 'Choose a color and size to continue.',
        duration: 4000,
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

  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false)
  const [isInWishlist, setIsInWishlist] = useState(false)
  const isProcessingWishlistRef = useRef(false)

  // Check wishlist status when variant changes
  useEffect(() => {
    if (!selectedVariant?.id) {
      setIsInWishlist(false)
      return
    }

    const checkWishlistStatus = async () => {
      try {
        const result = await checkWishlistStatusAction(selectedVariant.id)
        if (result.success) {
          setIsInWishlist(result.inWishlist)
        }
      } catch (error) {
        console.error('Error checking wishlist status:', error)
      }
    }

    checkWishlistStatus()
  }, [selectedVariant?.id])

  const handleWishlistToggle = async () => {
    // Double-click protection
    if (isProcessingWishlistRef.current) {
      return
    }

    if (!selectedVariant) {
      toast.error('Please select options', {
        description: 'Choose a color and size to add to wishlist.',
      })
      return
    }

    if (!selectedVariant.id || typeof selectedVariant.id !== 'string') {
      toast.error('Invalid product variant', {
        description: 'Please refresh the page and try again.',
      })
      return
    }

    // Set both ref and state immediately to prevent double-clicks
    isProcessingWishlistRef.current = true
    setIsTogglingWishlist(true)

    // Optimistic update
    const previousState = isInWishlist
    setIsInWishlist(!previousState)

    try {
      const result = await toggleWishlistAction(selectedVariant.id)

      if (!result.success) {
        // Revert optimistic update on error
        setIsInWishlist(previousState)
        toast.error(result.error || 'Failed to update wishlist', {
          description: 'Please try again.',
        })
        return
      }

      // Success - verify the new state to ensure UI is in sync
      try {
        const statusResult = await checkWishlistStatusAction(selectedVariant.id)
        if (statusResult.success) {
          setIsInWishlist(statusResult.inWishlist)
        }
      } catch (statusError) {
        console.error('Error verifying wishlist status:', statusError)
      }

      // Show appropriate message
      toast.success(previousState ? 'Removed from wishlist' : 'Added to wishlist', {
        description: previousState
          ? 'Item removed from your wishlist.'
          : 'Item added to your wishlist.',
      })
    } catch (error) {
      // Revert optimistic update on error
      setIsInWishlist(previousState)
      toast.error('An unexpected error occurred', {
        description: 'Please try again later.',
      })
      console.error('Error toggling wishlist:', error)
    } finally {
      // Reset both ref and state
      isProcessingWishlistRef.current = false
      setIsTogglingWishlist(false)
    }
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
              // Check if color is already a hex code, otherwise look it up in COLOR_MAP
              const colorHex = color.startsWith('#') 
                ? color 
                : (COLOR_MAP[color] || '#6B7280')
              const isLightColor = color === 'White' || color === 'Beige' || color === 'Yellow' || 
                (color.startsWith('#') && isLightHexColor(color))
              
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
                  title={color.startsWith('#') ? color : color}
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
          {showColorAlert && (
            <p className="text-sm text-destructive font-medium">Please select a color</p>
          )}
          {selectedColor && !showColorAlert && (
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
          {showSizeAlert && (
            <p className="text-sm text-destructive font-medium">Please select a size</p>
          )}
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

      {/* Add to Cart Button with Wishlist Icon */}
      <div className="flex items-center gap-2">
        <Button
          size="lg"
          className="flex-1 h-12"
          onClick={handleAddToCart}
          disabled={isAddingToCart}
          variant={!hasRequiredSelections ? 'outline' : 'default'}
        >
          <ShoppingCart className="mr-2 h-5 w-5" />
          {isAddingToCart
            ? 'Adding...'
            : !hasRequiredSelections
            ? 'Add to Cart'
            : !isAvailable
            ? 'Out of Stock'
            : 'Add to Cart'}
        </Button>

      {/* Wishlist Button - heart icon with visible label for accessibility & tests */}
      <button
        type="button"
        onClick={handleWishlistToggle}
        disabled={!selectedVariant || isTogglingWishlist}
        className={`
            h-12 px-3 rounded-lg border-2 transition-all duration-300 flex items-center justify-center gap-2 text-sm font-medium
            ${isInWishlist
              ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/20 hover:bg-red-600'
              : 'bg-background border-border hover:border-red-200 hover:bg-red-50/50 text-muted-foreground'
            }
            ${isTogglingWishlist ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}
            ${!selectedVariant ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        <Heart
          className={`h-5 w-5 transition-all duration-300 ${
            isInWishlist
              ? 'fill-white text-white scale-110'
              : 'text-muted-foreground'
          } ${isTogglingWishlist ? 'opacity-50 animate-pulse' : ''}`}
        />
        <span>
          {isInWishlist ? 'In wishlist' : 'Add to wishlist'}
        </span>
      </button>
      </div>
    </div>
  )
}
