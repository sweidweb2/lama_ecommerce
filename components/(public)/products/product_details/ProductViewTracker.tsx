"use client"

import { useEffect, useRef } from "react"
import { trackProductViewAction } from "@/actions/product_view"

interface ProductViewTrackerProps {
  productId: string
}

/**
 * Client component to track product views once per product visit.
 * Deduped so a soft RSC refresh / remount does not fire again.
 */
export function ProductViewTracker({ productId }: ProductViewTrackerProps) {
  const trackedRef = useRef(false)

  useEffect(() => {
    if (!productId || trackedRef.current) return

    const storageKey = `pv:${productId}`
    try {
      if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(storageKey)) {
        trackedRef.current = true
        return
      }
    } catch {
      // sessionStorage may be unavailable; fall through and track once via ref.
    }

    trackedRef.current = true
    try {
      sessionStorage.setItem(storageKey, "1")
    } catch {
      // ignore quota / private mode
    }

    trackProductViewAction(productId).catch((error: unknown) => {
      console.error("Failed to track product view:", error)
      trackedRef.current = false
      try {
        sessionStorage.removeItem(storageKey)
      } catch {
        // ignore
      }
    })
  }, [productId])

  return null
}
