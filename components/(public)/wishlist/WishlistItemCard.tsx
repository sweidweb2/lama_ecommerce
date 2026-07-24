'use client'

import { useState, useTransition } from 'react'
import { ShoppingBag, X } from 'lucide-react'
import { toast } from 'sonner'
import { ProductCard } from '@/components/common/ProductCard'
import { Button } from '@/components/ui/button'
import { removeWishlistItemAction } from '@/actions/wishlist'
import { addItemToCartAction } from '@/actions/cart'
import type { ProductWithRelations } from '@/types/product'

export type WishlistItemVariant = {
  id: string
  color: string | null
  size: string | null
  material: string | null
}

interface WishlistItemCardProps {
  wishlistId: string
  customisedProductId: string
  product: ProductWithRelations
  variant: WishlistItemVariant
}

function formatVariantLine(variant: WishlistItemVariant): string | null {
  const parts = [variant.color, variant.size, variant.material].filter(
    (v): v is string => Boolean(v && v.trim()),
  )
  if (parts.length === 0) return null
  return parts.join(' · ')
}

export function WishlistItemCard({
  wishlistId,
  customisedProductId,
  product,
  variant,
}: WishlistItemCardProps) {
  const [isPending, startTransition] = useTransition()
  const [isAdding, setIsAdding] = useState(false)
  const variantLine = formatVariantLine(variant)

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isPending) return

    startTransition(async () => {
      const result = await removeWishlistItemAction(wishlistId)
      if (!result.success) {
        toast.error(result.error || 'Failed to remove from wishlist')
        return
      }
      toast.success('Removed from wishlist')
    })
  }

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isAdding) return
    setIsAdding(true)

    try {
      const result = await addItemToCartAction({
        customised_product_id: customisedProductId,
        quantity: 1,
      })

      if (!result.success) {
        toast.error('Error', {
          description:
            result.error ||
            'Failed to add item to cart. Please try again.',
        })
        return
      }

      toast.success('Added to cart', {
        description: '1 item added successfully.',
      })

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('cart-updated'))
      }
    } catch (error) {
      console.error('Error adding wishlist item to cart:', error)
      toast.error('Error', {
        description: 'Failed to add item to cart. Please try again.',
      })
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="group relative flex h-full flex-col gap-2">
      <ProductCard product={product} />
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className="absolute top-2 right-2 z-10 h-8 w-8 rounded-full shadow-sm border border-border/60 bg-background/95 hover:bg-background"
        onClick={handleRemove}
        loading={isPending}
        loadingText=""
        aria-label={`Remove ${product.name} from wishlist`}
      >
        <X className="h-4 w-4" />
      </Button>
      {variantLine && (
        <p
          className="text-xs text-muted-foreground leading-snug px-0.5 line-clamp-1"
          title={variantLine}
        >
          {variantLine}
        </p>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full gap-1.5"
        loading={isAdding}
        loadingText="Add to cart"
        onClick={handleAddToCart}
      >
        <ShoppingBag className="h-3.5 w-3.5" />
        Add to cart
      </Button>
    </div>
  )
}
