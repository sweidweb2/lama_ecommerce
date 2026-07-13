import Link from "@/components/ui/link"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

export type AdminBreadcrumbItem = {
  label: string
  href?: string
}

interface AdminBreadcrumbsProps {
  items: AdminBreadcrumbItem[]
  className?: string
}

/**
 * Compact admin breadcrumbs. Last item is the current page (no link).
 */
export function AdminBreadcrumbs({ items, className }: AdminBreadcrumbsProps) {
  if (items.length === 0) return null

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest overflow-hidden",
        className,
      )}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        return (
          <div key={`${item.label}-${index}`} className="flex items-center gap-2 min-w-0">
            {index > 0 && <ChevronRight className="h-3 w-3 shrink-0" />}
            {isLast || !item.href ? (
              <span className="text-foreground truncate opacity-50">{item.label}</span>
            ) : (
              <Link
                href={item.href}
                className="hover:text-primary transition-colors shrink-0"
              >
                {item.label}
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}

/** Shared trail for pages under the Products sidebar group. */
export function ProductsSectionBreadcrumbs({
  current,
}: {
  current: string
}) {
  return (
    <AdminBreadcrumbs
      items={[
        { label: "Admin", href: "/admin" },
        { label: "Products", href: "/admin/products" },
        { label: current },
      ]}
    />
  )
}
