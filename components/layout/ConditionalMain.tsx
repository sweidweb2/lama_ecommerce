'use client'

import { usePathname } from 'next/navigation'
import { Navbar } from "@/components/common/Navbar"
import { Footer } from "@/components/common/Footer"

interface ConditionalLayoutProps {
  children: React.ReactNode
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname()
  const isAdminRoute = pathname?.startsWith('/admin')

  if (isAdminRoute) {
    // Admin routes have their own layout with header/sidebar
    // Don't render Navbar/Footer/main wrapper
    return <>{children}</>
  }

  // Public routes need the full layout with Navbar, main, and Footer
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}

