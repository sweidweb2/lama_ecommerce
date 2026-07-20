"use client"

import { useEffect, useRef } from "react"

interface ProductViewTrackerProps {
  productId: string
}

/**
 * Track product views once per product visit via API route.
 * Must not use a Server Action — those soft-refresh the PDP and reset scroll.
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

    const body = JSON.stringify({ productId })
    const track = () =>
      fetch("/api/product-views", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).then(async (res) => {
        if (!res.ok) {
          throw new Error(`Track failed (${res.status})`)
        }
      })

    track().catch((error: unknown) => {
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
