"use client"

import { useEffect, useState, useRef } from "react"
import { usePathname } from "next/navigation"
import { FullPageLoader } from "@/components/feedback/FullPageLoader"

export function AdminNavigationLoader() {
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(false)
  const previousPathname = useRef(pathname)

  useEffect(() => {
    // If pathname changed, show loader
    if (pathname !== previousPathname.current) {
      setIsLoading(true)
      previousPathname.current = pathname
      
      // Hide loader after navigation completes
      // The loading.tsx file will handle the actual loading state
      // This provides immediate feedback
      const timer = setTimeout(() => {
        setIsLoading(false)
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [pathname])

  if (!isLoading) return null

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <FullPageLoader />
    </div>
  )
}
