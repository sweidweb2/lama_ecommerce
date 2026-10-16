"use client"

import { Search, LogOut, ExternalLink } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/providers/AuthProvider"
import { logoutService } from "@/services/auth.service"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useState, useMemo, useRef, useEffect } from "react"
import { ROUTES } from "@/lib/constants/routes"
import Link from "@/components/ui/link"

/** Flat list of admin pages for search (href + label). */
const ADMIN_PAGES = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/brands", label: "Brands" },
  { href: "/admin/products/create", label: "Create Product" },
  { href: "/admin/carts", label: "Carts" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/product-views", label: "Product Views" },
  { href: "/admin/qa", label: "Q&A" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/contact", label: "Contact Us" },
  { href: "/admin/leads", label: "Leads" },
  { href: "/admin/backups", label: "Backups" },
  { href: "/admin/shippings", label: "Shippings" },
  { href: "/admin/promocodes", label: "Promo Codes" },
  { href: "/admin/account", label: "Account" },
]

export function AdminHeader() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  const filteredPages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return []
    return ADMIN_PAGES.filter(
      (p) =>
        p.label.toLowerCase().includes(q) ||
        p.href.toLowerCase().includes(q),
    )
  }, [searchQuery])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSearchFocus = () => setIsSearchOpen(true)
  const handleSelectPage = (href: string) => {
    router.push(href)
    setSearchQuery("")
    setIsSearchOpen(false)
  }

  const handleLogout = async () => {
    if (isLoggingOut) return

    setIsLoggingOut(true)
    try {
      const result = await logoutService()

      if (!result.success) {
        toast.error("Logout failed", {
          description: result.error,
        })
        return
      }

      toast.success("Logged out successfully")
      router.push(ROUTES.HOME)
      router.refresh()
    } catch (error) {
      toast.error("An unexpected error occurred", {
        description:
          error instanceof Error ? error.message : "Please try again",
      })
    } finally {
      setIsLoggingOut(false)
    }
  }

  const getUserDisplayName = () => {
    if (profile?.full_name) {
      return profile.full_name
    }
    if (user?.email) {
      return user.email.split("@")[0]
    }
    return "User"
  }

  const getUserInitials = () => {
    const name = getUserDisplayName()
    const parts = name.split(" ")
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />

      <div className="flex flex-1 items-center gap-2 md:gap-4">
        <div className="relative flex-1 max-w-md" ref={searchRef}>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" />
          <Input
            type="search"
            placeholder="Search admin pages..."
            className="pl-9 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={handleSearchFocus}
          />
          {isSearchOpen && searchQuery.trim() && (
            <div className="absolute top-full left-0 right-0 mt-1 rounded-md border bg-popover shadow-md z-50 max-h-[280px] overflow-y-auto">
              {filteredPages.length === 0 ? (
                <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                  No admin pages match &quot;{searchQuery.trim()}&quot;
                </div>
              ) : (
                <ul className="py-1">
                  {filteredPages.map((page) => (
                    <li key={page.href}>
                      <Link
                        href={page.href}
                        onClick={() => handleSelectPage(page.href)}
                        className="block px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                      >
                        {page.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 md:gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-9 w-9 rounded-full p-0"
            >
              <Avatar size="default">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <span className="sr-only">Open user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {getUserDisplayName()}
                </p>
                {user?.email && (
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a
                href={ROUTES.HOME}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center cursor-pointer"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                View website
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {isLoggingOut ? "Logging out..." : "Logout"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
