'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Navbar } from "@/components/common/Navbar"
import { Footer } from "@/components/common/Footer"

interface ConditionalLayoutProps {
  children: React.ReactNode
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // During SSR and initial render, always render public layout to avoid hydration mismatch
  // After mount, we can safely check the pathname
  const isAdminRoute = mounted && (pathname?.startsWith('/admin') ?? false)

  if (isAdminRoute) {
    // Admin routes have their own layout with header/sidebar
    // Don't render Navbar/Footer/main wrapper
    return <>{children}</>
  }

  // Public routes need the full layout with Navbar, main, and Footer
  // This is also the default during SSR to match server HTML
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-md focus:outline-none focus:ring-2 focus:ring-ring"
        suppressHydrationWarning
      >
        Skip to main content
      </a>
      <Navbar />
      <main id="main-content" className="flex-1" tabIndex={-1}>
        {children}
      </main>
      <Footer />
    </div>
  )
}
