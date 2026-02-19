"use client"

import { StatCard } from "@/components/admin/stat-card"
import {
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  AlertCircle,
  Star,
  Mail,
  TrendingUp,
} from "lucide-react"
import { formatPrice } from "@/lib/utils"
import type { AnalyticsStats as AnalyticsStatsType } from "@/repositories/analytics.repository"

interface AnalyticsStatsProps {
  stats: AnalyticsStatsType
}

export function AnalyticsStats({ stats }: AnalyticsStatsProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          description="Registered users"
          icon={Users}
        />
        <StatCard
          title="Total Products"
          value={stats.totalProducts.toLocaleString()}
          description="Active products"
          icon={Package}
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders.toLocaleString()}
          description="All orders"
          icon={ShoppingCart}
        />
        <StatCard
          title="Total Revenue"
          value={formatPrice(stats.totalRevenue)}
          description="From all orders"
          icon={DollarSign}
        />
      </div>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Carts"
          value={stats.activeCarts.toLocaleString()}
          description="Shopping carts"
          icon={ShoppingCart}
        />
        <StatCard
          title="Average Order Value"
          value={formatPrice(stats.averageOrderValue)}
          description="Per order"
          icon={TrendingUp}
        />
        <StatCard
          title="Pending Reviews"
          value={stats.pendingReviews.toLocaleString()}
          description="Awaiting moderation"
          icon={Star}
        />
        <StatCard
          title="Low Stock Products"
          value={stats.lowStockProducts.toLocaleString()}
          description="Stock ≤ 5"
          icon={AlertCircle}
        />
      </div>
      {stats.pendingContactUs > 0 && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Pending Contact"
            value={stats.pendingContactUs.toLocaleString()}
            description="Unresolved tickets"
            icon={Mail}
          />
        </div>
      )}
    </div>
  )
}
