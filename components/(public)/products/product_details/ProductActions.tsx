'use client'

import { useState } from 'react'
import { ShoppingCart, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useProductVariant } from './ProductVariantProvider'
import type { ProductVariant } from '@/types/product_utf8'

interface ProductActionsProps {
  productId: string
  variants: ProductVariant[]
}

/**
 * ProductActions Component
 * 
 * Maps to: carts table
 *          cart_items table
 *          wishlists table (customised_product_id)
 * 
 * Handles:
 * - Add to cart functionality
 * - Wishlist toggle
 * - Quantity selection
 * - Variant validation before adding to cart
 */
export function ProductActions({
  productId,
  variants,
}: ProductActionsProps) {
  const { selectedVariantId } = useProductVariant()
  const [quantity, setQuantity] = useState(1)
  const [isAddingToCart, setIsAddingToCart] = useState(false)

  const selectedVariant = selectedVariantId
    ? variants.find((v) => v.id === selectedVariantId)
    : variants.find((v) => v.quantity_stock > 0)

  const isAvailable = selectedVariant && selectedVariant.quantity_stock > 0
  const maxQuantity = selectedVariant?.quantity_stock || 0

  const handleAddToCart = async () => {
    if (!selectedVariant) {
      toast.error('Please select a variant', {
        description: 'Choose a color, size, and material to continue.',
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

    setIsAddingToCart(true)

    try {
      // TODO: Implement actual cart API call
      // await addToCart({
      //   customised_product_id: selectedVariant.id,
      //   quantity,
      // })

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500))

      toast.success('Added to cart', {
        description: `${quantity} item(s) added successfully.`,
      })
    } catch (error) {
      toast.error('Error', {
        description: 'Failed to add item to cart. Please try again.',
      })
    } finally {
      setIsAddingToCart(false)
    }
  }

  const handleWishlistToggle = async () => {
    if (!selectedVariant) {
      toast.error('Please select a variant', {
        description: 'Choose a variant to add to wishlist.',
      })
      return
    }

    // TODO: Implement wishlist API call
    // await toggleWishlist(selectedVariant.id)
    
    toast.success('Wishlist updated', {
      description: 'Item added to your wishlist.',
    })
  }

  return (
    <div className="space-y-4">
      {/* Quantity Selector */}
      {isAvailable && (
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">Quantity:</label>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
            >
              -
            </Button>
            <span className="w-12 text-center font-medium">{quantity}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
              disabled={quantity >= maxQuantity}
            >
              +
            </Button>
            {maxQuantity > 0 && (
              <span className="text-sm text-muted-foreground">
                ({maxQuantity} available)
              </span>
            )}
          </div>
        </div>
      )}

      {/* Add to Cart Button */}
      <Button
        size="lg"
        className="w-full h-12"
        onClick={handleAddToCart}
        disabled={!isAvailable || isAddingToCart}
      >
        <ShoppingCart className="mr-2 h-5 w-5" />
        {isAddingToCart
          ? 'Adding...'
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
