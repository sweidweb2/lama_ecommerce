import { Card, CardContent, CardHeader, CardTitle, CardAction } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Package, ArrowRight } from 'lucide-react'
import type { Order } from '@/types/order'

interface ProfileOrdersProps {
    orders: Order[]
}

export function ProfileOrders({ orders }: ProfileOrdersProps) {
    const getStatusColor = (status: string) => {
        const statusColors: Record<string, string> = {
            pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
            processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
            packed: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
            shipped: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400',
            delivered: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
            returned: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
            cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
        }
        return statusColors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        })
    }

    const formatCurrency = (amount: number | null) => {
        if (!amount) return '$0.00'
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount)
    }

    if (orders.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Recent Orders</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12">
                        <div className="bg-muted/30 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Package className="h-8 w-8 text-muted-foreground/40" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
                        <p className="text-sm text-muted-foreground mb-6">
                            When you place your first order, it will appear here.
                        </p>
                        <Link href="/products">
                            <Button size="lg" className="rounded-xl">
                                Start Shopping
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Recent Orders</CardTitle>
                    <CardAction>
                        <Link href="/orders">
                            <Button variant="ghost" size="sm" className="text-xs font-bold uppercase tracking-widest gap-2">
                                View All
                                <ArrowRight className="h-3 w-3" />
                            </Button>
                        </Link>
                    </CardAction>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {orders.slice(0, 6).map((order) => (
                        <Card
                            key={order.id}
                            className="hover:shadow-md transition-shadow"
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-semibold text-muted-foreground">
                                        Order #{order.id.slice(0, 8)}
                                    </span>
                                    <Badge
                                        className={`text-xs ${getStatusColor(order.status)}`}
                                    >
                                        {order.status}
                                    </Badge>
                                </div>
                                <CardTitle className="text-2xl font-black">
                                    {formatCurrency(order.total)}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="text-sm text-muted-foreground">
                                    <p className="flex items-center gap-2">
                                        <Package className="h-4 w-4" />
                                        Placed on {formatDate(order.created_at)}
                                    </p>
                                </div>
                                {order.payment_status && (
                                    <div className="text-xs">
                                        <span className="text-muted-foreground">Payment: </span>
                                        <span className={`font-semibold ${
                                            order.payment_status === 'paid' 
                                                ? 'text-green-600 dark:text-green-400' 
                                                : order.payment_status === 'pending'
                                                ? 'text-yellow-600 dark:text-yellow-400'
                                                : 'text-red-600 dark:text-red-400'
                                        }`}>
                                            {order.payment_status}
                                        </span>
                                    </div>
                                )}
                                <Link href={`/order_details/${order.id}`} className="block">
                                    <Button variant="outline" size="sm" className="w-full">
                                        View Details
                                        <ArrowRight className="h-3 w-3 ml-2" />
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

