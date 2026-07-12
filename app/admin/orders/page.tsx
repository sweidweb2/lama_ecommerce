import { OrdersTable } from "@/components/admin/order/OrdersTable"
import { getAdminOrders } from "@/services/order.service"
import { encryptOrderId } from "@/lib/utils/encryption"
import { 
  ShoppingCart, 
  Clock, 
  CheckCircle, 
  DollarSign, 
  Package,
  CreditCard
} from "lucide-react"
import { formatPrice } from "@/lib/utils"

export default async function OrdersPage() {
  const orders = await getAdminOrders()
  
  // Encrypt order IDs on the server side
  const ordersWithEncryptedIds = orders.map(order => ({
    ...order,
    encryptedId: encryptOrderId(order.id),
  }))

  // Calculate statistics
  const totalOrders = orders.length
  const pendingOrders = orders.filter(order => order.status === 'pending').length
  const processingOrders = orders.filter(order => order.status === 'processing' || order.status === 'packed').length
  const deliveredOrders = orders.filter(order => order.status === 'delivered').length
  const paidOrders = orders.filter(order => order.payment_status === 'paid').length
  const totalRevenue = orders
    .filter(order => order.payment_status === 'paid' && order.total)
    .reduce((sum, order) => sum + (order.total || 0), 0)

  const stats = [
    {
      title: "Total Orders",
      value: totalOrders.toLocaleString(),
      description: "All orders",
      icon: ShoppingCart,
      borderColor: "border-l-blue-500",
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-500",
    },
    {
      title: "Pending Orders",
      value: pendingOrders.toLocaleString(),
      description: "Awaiting processing",
      icon: Clock,
      borderColor: "border-l-yellow-500",
      iconBg: "bg-yellow-500/10",
      iconColor: "text-yellow-500",
    },
    {
      title: "Processing",
      value: processingOrders.toLocaleString(),
      description: "In progress",
      icon: Package,
      borderColor: "border-l-orange-500",
      iconBg: "bg-orange-500/10",
      iconColor: "text-orange-500",
    },
    {
      title: "Delivered",
      value: deliveredOrders.toLocaleString(),
      description: "Completed orders",
      icon: CheckCircle,
      borderColor: "border-l-green-500",
      iconBg: "bg-green-500/10",
      iconColor: "text-green-500",
    },
    {
      title: "Paid Orders",
      value: paidOrders.toLocaleString(),
      description: "Payment received",
      icon: CreditCard,
      borderColor: "border-l-purple-500",
      iconBg: "bg-purple-500/10",
      iconColor: "text-purple-500",
    },
    {
      title: "Total Revenue",
      value: formatPrice(totalRevenue),
      description: "From paid orders",
      icon: DollarSign,
      borderColor: "border-l-emerald-500",
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-500",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Orders</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Manage and track all orders
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.title}
              className={`rounded-lg border-l-4 border bg-card p-6 shadow-sm ${stat.borderColor}`}
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  {stat.description && (
                    <p className="text-xs text-muted-foreground">{stat.description}</p>
                  )}
                </div>
                <div className={`rounded-full p-3 ${stat.iconBg}`}>
                  <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <OrdersTable orders={ordersWithEncryptedIds} />
    </div>
  )
}
