import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from "@/components/ui/link"
import {
    ShoppingBag,
    Heart,
    Settings,
    MapPin,
    ArrowRight
} from 'lucide-react'

export function ProfileActions() {
    const actions = [
        {
            label: 'My Orders',
            description: 'View order history and track shipments',
            icon: ShoppingBag,
            href: '/orders',
            color: 'text-blue-600',
            bgColor: 'bg-blue-50 dark:bg-blue-950/20',
        },
        {
            label: 'Wishlist',
            description: 'Your saved favorite items',
            icon: Heart,
            href: '/wishlist',
            color: 'text-red-600',
            bgColor: 'bg-red-50 dark:bg-red-950/20',
        },
        {
            label: 'Addresses',
            description: 'Manage shipping addresses',
            icon: MapPin,
            href: '/account',
            color: 'text-green-600',
            bgColor: 'bg-green-50 dark:bg-green-950/20',
        },
        {
            label: 'Account Settings',
            description: 'Update your profile and preferences',
            icon: Settings,
            href: '/profile/setting',
            color: 'text-gray-600',
            bgColor: 'bg-gray-50 dark:bg-gray-950/20',
        },
    ]

    return (
        <Card>
            <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {actions.map((action) => {
                        const Icon = action.icon
                        return (
                            <Link key={action.label} href={action.href}>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start h-auto p-4 group hover:bg-accent transition-colors"
                                >
                                    <div className={`${action.bgColor} w-10 h-10 rounded-lg flex items-center justify-center mr-3`}>
                                        <Icon className={`h-5 w-5 ${action.color}`} />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <div className="font-semibold">{action.label}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {action.description}
                                        </div>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </Link>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
