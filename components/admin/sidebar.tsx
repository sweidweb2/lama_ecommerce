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
  List,
  Tag,
  Tags,
  UserPlus,
  ChevronDown,
  type LucideIcon,
} from "lucide-react"
import { SidebarItem } from "./sidebar-item"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

type MenuChild = {
  href: string
  label: string
  icon: LucideIcon
}

type MenuItem = {
  id: string
  label: string
  icon: LucideIcon
  /** Leaf link (no children). */
  href?: string
  children?: MenuChild[]
  /** Extra path prefixes that should keep this group open (pages not listed as children). */
  matchPrefixes?: string[]
}

const menuItems: MenuItem[] = [
  {
    id: "dashboard",
    href: "/admin",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    id: "catalog",
    label: "Catalog",
    icon: Package,
    matchPrefixes: ["/admin/products", "/admin/product-views", "/admin/categories", "/admin/brands"],
    children: [
      { href: "/admin/products", label: "All Products", icon: List },
      { href: "/admin/categories", label: "Categories", icon: Tag },
      { href: "/admin/brands", label: "Brands", icon: Tags },
    ],
  },
  {
    id: "sales",
    label: "Sales",
    icon: ShoppingCart,
    matchPrefixes: ["/admin/orders", "/admin/carts", "/admin/shippings", "/admin/promocodes"],
    children: [
      { href: "/admin/orders", label: "Orders", icon: FileText },
      { href: "/admin/carts", label: "Carts", icon: ShoppingCart },
      { href: "/admin/shippings", label: "Shipping", icon: Truck },
      { href: "/admin/promocodes", label: "Promo Codes", icon: Ticket },
    ],
  },
  {
    id: "customers",
    label: "Customers",
    icon: Users,
    matchPrefixes: ["/admin/users", "/admin/leads", "/admin/contact"],
    children: [
      { href: "/admin/users", label: "Users", icon: Users },
      { href: "/admin/leads", label: "Leads", icon: UserPlus },
      { href: "/admin/contact", label: "Contact Us", icon: Mail },
    ],
  },
  {
    id: "engagement",
    label: "Engagement",
    icon: Star,
    matchPrefixes: ["/admin/reviews", "/admin/qa"],
    children: [
      { href: "/admin/reviews", label: "Reviews", icon: Star },
      { href: "/admin/qa", label: "Q&A", icon: HelpCircle },
    ],
  },
  {
    id: "insights",
    href: "/admin/analytics",
    label: "Analytics",
    icon: BarChart3,
  },
  {
    id: "system",
    href: "/admin/backups",
    label: "Backups",
    icon: Database,
  },
]

function pathMatchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

function isChildActive(pathname: string, child: MenuChild, allChildHrefs: string[]): boolean {
  if (child.href === "/admin") return pathname === child.href
  if (pathname === child.href) return true
  if (!pathname.startsWith(`${child.href}/`) && !pathname.startsWith(child.href)) {
    return false
  }
  if (pathname.startsWith(child.href)) {
    const hasMoreSpecificMatch = allChildHrefs.some(
      (other) =>
        other !== child.href &&
        pathname.startsWith(other) &&
        other.length > child.href.length,
    )
    return !hasMoreSpecificMatch
  }
  return false
}

function groupHasActiveChild(pathname: string, item: MenuItem): boolean {
  if (!item.children?.length) return false
  const allChildHrefs = item.children.map((c) => c.href)
  if (item.children.some((child) => isChildActive(pathname, child, allChildHrefs))) {
    return true
  }
  return (item.matchPrefixes ?? []).some((prefix) => pathMatchesPrefix(pathname, prefix))
}

function groupButtonClass(hasActiveChild: boolean) {
  if (hasActiveChild) {
    return "bg-primary/10 text-primary hover:bg-primary/20"
  }
  return "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
}

interface SidebarProps {
  className?: string
  onLinkClick?: () => void
}

export function Sidebar({ className, onLinkClick }: SidebarProps) {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const activeGroupIds = useMemo(() => {
    return menuItems
      .filter((item) => item.children?.length && groupHasActiveChild(pathname, item))
      .map((item) => item.id)
  }, [pathname])

  useEffect(() => {
    if (activeGroupIds.length === 0) return
    setExpanded((prev) => {
      const next = { ...prev }
      let changed = false
      for (const id of activeGroupIds) {
        if (!next[id]) {
          next[id] = true
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [activeGroupIds])

  const toggleGroup = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <aside className={cn("flex h-full flex-col", className)}>
      <div className="flex h-16 items-center border-b px-4 md:px-6">
        <h2 className="text-lg font-semibold">Admin Panel</h2>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-4 hide-scrollbar">
        {menuItems.map((item) => {
          const allChildHrefs = item.children?.map((child) => child.href) ?? []
          const hasActiveChild = groupHasActiveChild(pathname, item)
          const isGroup = Boolean(item.children?.length)
          const isExpanded = isGroup ? Boolean(expanded[item.id]) : true

          if (!isGroup && item.href) {
            const isParentActive =
              item.href === "/admin"
                ? pathname === item.href
                : pathMatchesPrefix(pathname, item.href)

            return (
              <div key={item.id}>
                <SidebarItem
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  onLinkClick={onLinkClick}
                  isParentActive={isParentActive}
                  hasActiveChild={false}
                />
              </div>
            )
          }

          return (
            <div key={item.id}>
              <button
                type="button"
                onClick={() => toggleGroup(item.id)}
                aria-expanded={isExpanded}
                className={cn(
                  "w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-left",
                  groupButtonClass(hasActiveChild),
                )}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1">{item.label}</span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform duration-200 ease-out",
                    isExpanded ? "rotate-0" : "-rotate-90",
                  )}
                />
              </button>
              <div
                className={cn(
                  "grid transition-[grid-template-rows] duration-200 ease-out",
                  isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                )}
              >
                <div className="overflow-hidden">
                  <div className="space-y-1 pt-1">
                    {item.children?.map((child) => (
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
                </div>
              </div>
            </div>
          )
        })}
      </nav>
    </aside>
  )
}
