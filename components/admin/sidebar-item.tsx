"use client"

import Link from "@/components/ui/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface SidebarItemProps {
  href: string
  label: string
  icon: LucideIcon
  isNested?: boolean
  onLinkClick?: () => void
  isParentActive?: boolean
  hasActiveChild?: boolean
  allChildHrefs?: string[] // All child hrefs for this parent
}

export function SidebarItem({
  href,
  label,
  icon: Icon,
  isNested = false,
  onLinkClick,
  isParentActive = false,
  hasActiveChild = false,
  allChildHrefs = [],
}: SidebarItemProps) {
  const pathname = usePathname()
  const [isNavigating, setIsNavigating] = useState(false)
  
  // For nested items (children), check if this exact route is active
  // We need to be more precise to avoid matching parent routes when a more specific child is active
  const isActive = (() => {
    if (href === "/admin") {
      return pathname === href
    }
    
    if (isNested) {
      // For child items, check exact match first
      if (pathname === href) {
        return true
      }
      
      // Check if pathname starts with this href followed by a /
      if (pathname.startsWith(`${href}/`)) {
        // Check if any other child href is a more specific match (longer prefix)
        // If so, this item should not be active
        const hasMoreSpecificMatch = allChildHrefs.some(
          (childHref) =>
            childHref !== href &&
            pathname.startsWith(childHref) &&
            childHref.length > href.length
        )
        return !hasMoreSpecificMatch
      }
      return false
    } else {
      // For parent items, check exact match or starts with, but only if no child is active
      return pathname === href || pathname.startsWith(`${href}/`)
    }
  })()

  // Reset navigating state when pathname changes to match href
  useEffect(() => {
    if (isNavigating && (pathname === href || pathname.startsWith(`${href}/`))) {
      setIsNavigating(false)
    }
  }, [pathname, href, isNavigating])

  // Determine the styling based on state
  const getClassName = () => {
    if (isNested) {
      // Child item - full active state if active
      return isActive
        ? "bg-primary text-primary-foreground"
        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
    } else {
      // Parent item
      if (isActive && !hasActiveChild) {
        // Parent is directly active (no child active)
        return "bg-primary text-primary-foreground"
      } else if (hasActiveChild && !isActive) {
        // Child is active, parent gets subtle effect
        return "bg-primary/10 text-primary hover:bg-primary/20"
      } else {
        // Normal state
        return "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      }
    }
  }

  const handleClick = () => {
    // Only set navigating state if it's a different route
    if (pathname !== href && !pathname.startsWith(`${href}/`)) {
      setIsNavigating(true)
    }
    onLinkClick?.()
  }

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        isNested && "ml-6",
        isNavigating && "opacity-70 cursor-wait",
        getClassName()
      )}
    >
      <Icon className={cn("h-4 w-4", isNavigating && "animate-pulse")} />
      <span className="flex-1">{label}</span>
    </Link>
  )
}
