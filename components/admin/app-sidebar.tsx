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
  Grid3x3,
  Tag,
  Tags,
  Eye,
  UserPlus,
  ChevronRight,
  ExternalLink,
  type LucideIcon,
} from "lucide-react"
import Link from "@/components/ui/link"
import { usePathname } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { ROUTES } from "@/lib/constants/routes"

type MenuChild = {
  href: string
  label: string
  icon: LucideIcon
}

type MenuItem = {
  id: string
  label: string
  icon: LucideIcon
  href?: string
  children?: MenuChild[]
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
    matchPrefixes: [
      "/admin/products",
      "/admin/product-views",
      "/admin/categories",
      "/admin/brands",
    ],
    children: [
      { href: "/admin/products", label: "All Products", icon: List },
      { href: "/admin/products/grid", label: "Grid", icon: Grid3x3 },
      { href: "/admin/product-views", label: "Product Views", icon: Eye },
      { href: "/admin/categories", label: "Categories", icon: Tag },
      { href: "/admin/brands", label: "Brands", icon: Tags },
    ],
  },
  {
    id: "sales",
    label: "Sales",
    icon: ShoppingCart,
    matchPrefixes: [
      "/admin/orders",
      "/admin/carts",
      "/admin/shippings",
      "/admin/promocodes",
    ],
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

function isChildActive(
  pathname: string,
  child: MenuChild,
  allChildHrefs: string[],
): boolean {
  if (child.href === "/admin") return pathname === child.href
  if (pathname === child.href) return true
  if (
    !pathname.startsWith(`${child.href}/`) &&
    !pathname.startsWith(child.href)
  ) {
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
  if (
    item.children.some((child) => isChildActive(pathname, child, allChildHrefs))
  ) {
    return true
  }
  return (item.matchPrefixes ?? []).some((prefix) =>
    pathMatchesPrefix(pathname, prefix),
  )
}

function NavLink({
  href,
  onNavigate,
  children,
  ...props
}: React.ComponentProps<typeof Link> & {
  href: string
  onNavigate?: () => void
}) {
  return (
    <Link
      href={href}
      onClick={() => {
        onNavigate?.()
      }}
      {...props}
    >
      {children}
    </Link>
  )
}

export function AppSidebar(
  props: React.ComponentProps<typeof Sidebar>,
) {
  const pathname = usePathname()
  const { isMobile, setOpenMobile } = useSidebar()
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const closeMobile = () => {
    if (isMobile) setOpenMobile(false)
  }

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

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip="Admin Panel">
              <NavLink href="/admin" onNavigate={closeMobile}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <LayoutDashboard className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Admin Panel</span>
                  <span className="truncate text-xs text-sidebar-foreground/70">
                    Lama Ecommerce
                  </span>
                </div>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const allChildHrefs = item.children?.map((c) => c.href) ?? []
                const hasActiveChild = groupHasActiveChild(pathname, item)
                const isGroup = Boolean(item.children?.length)

                if (!isGroup && item.href) {
                  const isActive =
                    item.href === "/admin"
                      ? pathname === item.href
                      : pathMatchesPrefix(pathname, item.href)

                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.label}
                      >
                        <NavLink href={item.href} onNavigate={closeMobile}>
                          <item.icon />
                          <span>{item.label}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                }

                const isOpen = Boolean(expanded[item.id])

                return (
                  <Collapsible
                    key={item.id}
                    asChild
                    open={isOpen}
                    onOpenChange={(open) =>
                      setExpanded((prev) => ({ ...prev, [item.id]: open }))
                    }
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          tooltip={item.label}
                          isActive={hasActiveChild}
                        >
                          <item.icon />
                          <span>{item.label}</span>
                          <ChevronRight className="ml-auto transition-transform duration-200 ease-out group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.children?.map((child) => {
                            const active = isChildActive(
                              pathname,
                              child,
                              allChildHrefs,
                            )
                            return (
                              <SidebarMenuSubItem key={child.href}>
                                <SidebarMenuSubButton asChild isActive={active}>
                                  <NavLink
                                    href={child.href}
                                    onNavigate={closeMobile}
                                  >
                                    <child.icon />
                                    <span>{child.label}</span>
                                  </NavLink>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            )
                          })}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="View storefront">
              <a href={ROUTES.HOME} target="_blank" rel="noopener noreferrer">
                <ExternalLink />
                <span>View storefront</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
