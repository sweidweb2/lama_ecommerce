'use client'

import { useState, useRef, useEffect } from 'react'
import { ShoppingCart, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useProductVariant } from './ProductVariantProvider'
import type { ProductVariant } from '@/types/product_utf8'
import { toggleWishlistAction, checkWishlistStatusAction } from '@/actions/wishlist'

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
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false)
  const [isInWishlist, setIsInWishlist] = useState(false)
  // Refs to prevent double-click - faster than state updates
  const isProcessingCartRef = useRef(false)
  const isProcessingWishlistRef = useRef(false)

  const selectedVariant = selectedVariantId
    ? variants.find((v) => v.id === selectedVariantId)
    : variants.find((v) => v.quantity_stock > 0)

  const isAvailable = selectedVariant && selectedVariant.quantity_stock > 0
  const maxQuantity = selectedVariant?.quantity_stock || 0

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
        // Silently fail - wishlist status check is not critical
        console.error('Error checking wishlist status:', error)
      }
    }

    checkWishlistStatus()
  }, [selectedVariant?.id])

  const handleAddToCart = async () => {
    // Double-click protection: check ref immediately (faster than state)
    if (isProcessingCartRef.current) {
      return // Already processing, ignore this click
    }

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

    // Set both ref and state immediately to prevent double-clicks
    isProcessingCartRef.current = true
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
      // Reset both ref and state
      isProcessingCartRef.current = false
      setIsAddingToCart(false)
    }
  }

  const handleWishlistToggle = async () => {
    // Double-click protection: check ref immediately (faster than state)
    if (isProcessingWishlistRef.current) {
      return // Already processing, ignore this click
    }

    // Validation: Check if variant is selected
    if (!selectedVariant) {
      toast.error('Please select a variant', {
        description: 'Choose a color, size, and material to add to wishlist.',
      })
      return
    }

    // Validation: Check if variant ID is valid UUID
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
        // If status check fails, keep the optimistic update
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

      {/* Add to Cart Button with Wishlist Icon */}
      <div className="flex items-center gap-2">
        <Button
          size="lg"
          className="flex-1 h-12"
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

        {/* Wishlist Icon Card - Small card with heart icon */}
        <button
          type="button"
          onClick={handleWishlistToggle}
          disabled={!selectedVariant || isTogglingWishlist}
          className={`
            h-12 w-12 rounded-lg border-2 transition-all duration-300 flex items-center justify-center
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
        </button>
      </div>
    </div>
  )
}
