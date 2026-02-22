"use client"

import { useEffect } from "react"
import { trackProductViewAction } from "@/actions/product_view"

interface ProductViewTrackerProps {
  productId: string
}

/**
 * Client component to track product views.
 * This is needed because cookie setting in Server Actions can only happen
 * when called from client components or form actions, not from Server Components.
 */
export function ProductViewTracker({ productId }: ProductViewTrackerProps) {
  useEffect(() => {
    // Track product view in the background
    trackProductViewAction(productId).catch((error: unknown) => {
      console.error("Failed to track product view:", error)
    })
  }, [productId])

  return null // This component doesn't render anything
}
