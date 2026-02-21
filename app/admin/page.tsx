import { StatCard } from "@/components/admin/stat-card"
import {
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Clock,
  AlertCircle,
  MessageSquare,
  Star,
} from "lucide-react"
import {
  getDashboardStatsService,
  getRecentOrdersService,
  getRecentUsersService,
} from "@/services/dashboard.service"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-US").format(num)
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds ago`
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours} ${hours === 1 ? "hour" : "hours"} ago`
  } else {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days} ${days === 1 ? "day" : "days"} ago`
  }
}

function getStatusBadgeVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  switch (status.toLowerCase()) {
    case "pending":
      return "secondary"
    case "processing":
    case "packed":
      return "default"
    case "shipped":
    case "delivered":
      return "outline"
    case "cancelled":
    case "returned":
      return "destructive"
    default:
      return "secondary"
  }
}

export default async function AdminDashboard() {
  const [stats, recentOrders, recentUsers] = await Promise.all([
    getDashboardStatsService(),
    getRecentOrdersService(5),
    getRecentUsersService(5),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Overview of your e-commerce platform
        </p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={formatNumber(stats.totalUsers)}
          description="Active users"
          icon={Users}
        />
        <StatCard
          title="Total Products"
          value={formatNumber(stats.totalProducts)}
          description="Active products"
          icon={Package}
        />
        <StatCard
          title="Total Orders"
          value={formatNumber(stats.totalOrdersThisMonth)}
          description="This month"
          icon={ShoppingCart}
        />
        <StatCard
          title="Revenue"
          value={formatCurrency(stats.revenueThisMonth)}
          description="This month"
          icon={DollarSign}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Recent Orders</h3>
            <Link
              href="/admin/orders"
              className="text-sm text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent orders</p>
            ) : (
              recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="flex items-center justify-between rounded-md p-2 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      Order #{order.id.slice(0, 8)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant={getStatusBadgeVariant(order.status)}
                        className="text-xs"
                      >
                        {order.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatCurrency(order.total)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {order.userName} • {formatTimeAgo(order.created_at)}
                    </p>
                  </div>
                  <TrendingUp className="h-4 w-4 text-green-600 flex-shrink-0 ml-2" />
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Recent Users</h3>
            <Link
              href="/admin/users"
              className="text-sm text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {recentUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent users</p>
            ) : (
              recentUsers.map((user) => (
                <Link
                  key={user.user_id}
                  href="/admin/users"
                  className="flex items-center justify-between rounded-md p-2 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {user.full_name || "Unknown User"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatTimeAgo(user.created_at)}
                    </p>
                  </div>
                  <Users className="h-4 w-4 text-primary flex-shrink-0 ml-2" />
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/admin/orders?status=pending"
          className="rounded-lg border bg-card p-6 shadow-sm hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Pending Orders
              </p>
              <p className="text-2xl font-bold mt-1">{stats.pendingOrders}</p>
            </div>
            <Clock className="h-8 w-8 text-orange-500" />
          </div>
        </Link>

        <Link
          href="/admin/products"
          className="rounded-lg border bg-card p-6 shadow-sm hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Low Stock Items
              </p>
              <p className="text-2xl font-bold mt-1">{stats.lowStockItems}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-yellow-500" />
          </div>
        </Link>

        <Link
          href="/admin/qa"
          className="rounded-lg border bg-card p-6 shadow-sm hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Unanswered Q&A
              </p>
              <p className="text-2xl font-bold mt-1">{stats.unansweredQA}</p>
            </div>
            <MessageSquare className="h-8 w-8 text-blue-500" />
          </div>
        </Link>

        <Link
          href="/admin/reviews?status=pending"
          className="rounded-lg border bg-card p-6 shadow-sm hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Pending Reviews
              </p>
              <p className="text-2xl font-bold mt-1">{stats.pendingReviews}</p>
            </div>
            <Star className="h-8 w-8 text-purple-500" />
          </div>
        </Link>
      </div>
    </div>
  )
}
