"use client"

import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  FileText,
  BarChart3,
  HelpCircle,
  Star,
  Mail,
  Database,
  Truck,
  Ticket,
  Plus,
  List,
  Grid3x3,
  Tag,
  Tags,
  UserPlus,
  ChevronRight,
  ChevronDown,
  Eye,
} from "lucide-react"
import { SidebarItem } from "./sidebar-item"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"

const menuItems = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/users",
    label: "Users",
    icon: Users,
  },
  {
    href: "/admin/products",
    label: "Products",
    icon: Package,
    children: [
      {
        href: "/admin/products",
        label: "All Products",
        icon: List,
      },
      {
        href: "/admin/products/grid",
        label: "Grid Products",
        icon: Grid3x3,
      },
      {
        href: "/admin/categories",
        label: "Categories",
        icon: Tag,
      },
      {
        href: "/admin/brands",
        label: "Brands",
        icon: Tags,
      },
      {
        href: "/admin/products/create",
        label: "Create Product",
        icon: Plus,
      },
      {
        href: "/admin/product-views",
        label: "Product Views",
        icon: Eye,
      },
    ],
  },
  {
    href: "/admin/carts",
    label: "Carts",
    icon: ShoppingCart,
  },
  {
    href: "/admin/orders",
    label: "Orders",
    icon: FileText,
  },
  // {
  //   href: "/admin/website-content",
  //   label: "Website Content",
  //   icon: FileText,
  // },
  {
    href: "/admin/analytics",
    label: "Analytics",
    icon: BarChart3,
  },
  {
    href: "/admin/qa",
    label: "Q&A",
    icon: HelpCircle,
  },
  {
    href: "/admin/reviews",
    label: "Reviews",
    icon: Star,
  },
  {
    href: "/admin/contact",
    label: "Contact Us",
    icon: Mail,
  },
  {
    href: "/admin/leads",
    label: "Leads",
    icon: UserPlus,
  },
  {
    href: "/admin/backups",
    label: "Backups",
    icon: Database,
  },
  {
    href: "/admin/shippings",
    label: "Shippings",
    icon: Truck,
  },
  {
    href: "/admin/promocodes",
    label: "Promo Codes",
    icon: Ticket,
  },
]

interface SidebarProps {
  className?: string
  onLinkClick?: () => void
}

// Helper function to get className for Products button
const getProductsClassName = (isParentActive: boolean, hasActiveChild: boolean) => {
  if (isParentActive && !hasActiveChild) {
    return "bg-primary text-primary-foreground"
  } else if (hasActiveChild && !isParentActive) {
    return "bg-primary/10 text-primary hover:bg-primary/20"
  } else {
    return "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
  }
}

export function Sidebar({ className, onLinkClick }: SidebarProps) {
  const pathname = usePathname()
  const [isProductsExpanded, setIsProductsExpanded] = useState(false)

  // Auto-expand Products if any child is active
  useEffect(() => {
    const productsItem = menuItems.find((item) => item.href === "/admin/products")
    if (productsItem?.children) {
      const hasActiveChild = productsItem.children.some((child) => {
        if (pathname === child.href) return true
        if (pathname.startsWith(child.href)) {
          // Check if any other child is a more specific match
          const allChildHrefs = productsItem.children.map((c) => c.href)
          const hasMoreSpecificMatch = allChildHrefs.some(
            (otherChildHref) =>
              otherChildHref !== child.href &&
              pathname.startsWith(otherChildHref) &&
              otherChildHref.length > child.href.length
          )
          return !hasMoreSpecificMatch
        }
        return false
      })
      if (hasActiveChild) {
        setIsProductsExpanded(true)
      }
    }
  }, [pathname])

  return (
    <aside className={cn("flex h-full flex-col", className)}>
      <div className="flex h-16 items-center border-b px-4 md:px-6">
        <h2 className="text-lg font-semibold">Admin Panel</h2>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-4 hide-scrollbar">
        {menuItems.map((item) => {
          // Get all child hrefs for this parent
          const allChildHrefs = item.children?.map((child) => child.href) ?? []
          
          // Check if any child is active (exact match or pathname starts with child href)
          // But prioritize more specific (longer) matches
          const hasActiveChild = item.children?.some((child) => {
            if (child.href === "/admin") {
              return pathname === child.href
            }
            // Exact match
            if (pathname === child.href) {
              return true
            }
            // Check if pathname starts with child href
            if (pathname.startsWith(child.href)) {
              // Check if any other child is a more specific match (longer prefix)
              const hasMoreSpecificMatch = allChildHrefs.some(
                (otherChildHref) =>
                  otherChildHref !== child.href &&
                  pathname.startsWith(otherChildHref) &&
                  otherChildHref.length > child.href.length
              )
              return !hasMoreSpecificMatch
            }
            return false
          }) ?? false

          // Check if parent itself is active (exact match, and no child is active)
          // If a child is active, parent should not be fully active
          const isParentActive =
            !hasActiveChild &&
            (item.href === "/admin"
              ? pathname === item.href
              : pathname === item.href && !pathname.startsWith(`${item.href}/`))

          // Check if this is the Products item
          const isProducts = item.href === "/admin/products"
          const isExpanded = isProducts ? isProductsExpanded : true

          return (
            <div key={item.href}>
              {isProducts ? (
                <button
                  onClick={() => setIsProductsExpanded(!isProductsExpanded)}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-left mb-2",
                    getProductsClassName(isParentActive, hasActiveChild)
                  )}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {isProductsExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  )}
                </button>
              ) : (
                <SidebarItem
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  onLinkClick={onLinkClick}
                  isParentActive={isParentActive}
                  hasActiveChild={hasActiveChild}
                />
              )}
              {isExpanded && item.children?.map((child) => (
                <SidebarItem
                  key={child.href}
                  href={child.href}
                  label={child.label}
                  icon={child.icon}
                  isNested
                  onLinkClick={onLinkClick}
                  allChildHrefs={allChildHrefs}
                />
              ))}
            </div>
          )
        })}
      </nav>
    </aside>
  )
}
