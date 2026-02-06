import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

interface CartDetailsBreadcrumbsProps {
  cartId: string
}

export function CartDetailsBreadcrumbs({ cartId }: CartDetailsBreadcrumbsProps) {
  return (
    <div className="container mx-auto px-4 py-4 md:py-6">
      <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest overflow-hidden">
        <Link href="/admin" className="hover:text-primary transition-colors shrink-0">
          Admin
        </Link>
        <ChevronRight className="h-3 w-3 shrink-0" />
        <Link href="/admin/carts" className="hover:text-primary transition-colors shrink-0">
          Carts
        </Link>
        <ChevronRight className="h-3 w-3 shrink-0" />
        <span className="text-foreground truncate opacity-50 font-mono text-xs">
          {cartId.slice(0, 8)}...
        </span>
      </div>
    </div>
  )
}
