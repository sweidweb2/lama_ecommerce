import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

interface ProductBreadcrumbsProps {
    productName: string
}

export function ProductBreadcrumbs({ productName }: ProductBreadcrumbsProps) {
    return (
        <div className="container mx-auto px-4 py-4 md:py-6">
            <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest overflow-hidden">
                <Link href="/" className="hover:text-primary transition-colors shrink-0">
                    Home
                </Link>
                <ChevronRight className="h-3 w-3 shrink-0" />
                <Link href="/products" className="hover:text-primary transition-colors shrink-0">
                    Products
                </Link>
                <ChevronRight className="h-3 w-3 shrink-0" />
                <span className="text-foreground truncate opacity-50">{productName}</span>
            </div>
        </div>
    )
}
