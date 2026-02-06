import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

interface OrderBreadcrumbsProps {
    orderId: string
}

export function OrderBreadcrumbs({ orderId }: OrderBreadcrumbsProps) {
    const formattedOrderId = orderId.substring(0, 8).toUpperCase()
    
    return (
        <div className="container mx-auto px-4 py-4 md:py-6">
            <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest overflow-hidden">
                <Link href="/" className="hover:text-primary transition-colors shrink-0">
                    Home
                </Link>
                <ChevronRight className="h-3 w-3 shrink-0" />
                <Link href="/orders" className="hover:text-primary transition-colors shrink-0">
                    Orders
                </Link>
                <ChevronRight className="h-3 w-3 shrink-0" />
                <span className="text-foreground truncate opacity-50">Order #{formattedOrderId}</span>
            </div>
        </div>
    )
}
