'use client'

import { Card } from '@/components/ui/card'
import { Heart, Package, DollarSign, TrendingUp } from 'lucide-react'
import type { ProductWithRelations } from '@/types/product'

interface WishlistStatsProps {
    items: Array<{ product: ProductWithRelations }>
}

export function WishlistStats({ items }: WishlistStatsProps) {
    const totalItems = items.length
    const totalValue = items.reduce((sum, item) => sum + item.product.price, 0)
    const uniqueCategories = new Set(items.map(item => item.product.category_id)).size
    const featuredCount = items.filter(item => item.product.is_featured).length

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="p-4 border-border/40">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                        <Heart className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Items</p>
                        <p className="text-2xl font-bold">{totalItems}</p>
                    </div>
                </div>
            </Card>

            <Card className="p-4 border-border/40">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/10">
                        <DollarSign className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Value</p>
                        <p className="text-2xl font-bold">${totalValue.toFixed(2)}</p>
                    </div>
                </div>
            </Card>

            <Card className="p-4 border-border/40">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                        <Package className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Categories</p>
                        <p className="text-2xl font-bold">{uniqueCategories}</p>
                    </div>
                </div>
            </Card>

            <Card className="p-4 border-border/40">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-orange-500/10">
                        <TrendingUp className="h-5 w-5 text-orange-500" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Featured</p>
                        <p className="text-2xl font-bold">{featuredCount}</p>
                    </div>
                </div>
            </Card>
        </div>
    )
}
