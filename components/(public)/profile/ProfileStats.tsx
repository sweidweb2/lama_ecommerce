import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ShoppingBag, Heart, Package } from 'lucide-react'

interface ProfileStatsProps {
    orderCount?: number
    wishlistCount?: number
}

export function ProfileStats({ orderCount = 0, wishlistCount = 0 }: ProfileStatsProps) {
    const stats = [
        {
            label: 'Total Orders',
            value: orderCount,
            icon: ShoppingBag,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50 dark:bg-blue-950/20',
        },
        {
            label: 'Wishlist Items',
            value: wishlistCount,
            icon: Heart,
            color: 'text-red-600',
            bgColor: 'bg-red-50 dark:bg-red-950/20',
        },
        {
            label: 'Active Orders',
            value: 0, // TODO: Calculate active orders
            icon: Package,
            color: 'text-green-600',
            bgColor: 'bg-green-50 dark:bg-green-950/20',
        },
    ]

    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {stats.map((stat) => {
                const Icon = stat.icon
                return (
                    <Card key={stat.label}>
                        <CardHeader className="pb-3">
                            <div className={`${stat.bgColor} w-10 h-10 rounded-lg flex items-center justify-center mb-2`}>
                                <Icon className={`h-5 w-5 ${stat.color}`} />
                            </div>
                            <CardTitle className="text-3xl font-black">
                                {stat.value}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                {stat.label}
                            </p>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}

