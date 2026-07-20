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
import { METRIC_LABELS } from "@/lib/admin/metric-definitions"
import type { AnalyticsStats as AnalyticsStatsType } from "@/repositories/analytics.repository"

interface AnalyticsStatsProps {
  stats: AnalyticsStatsType
  rangeLabel?: string
}

export function AnalyticsStats({ stats, rangeLabel }: AnalyticsStatsProps) {
  const scope = rangeLabel ?? "All time"

  return (
    <div className="space-y-4">
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={METRIC_LABELS.activeUsers}
          value={stats.totalUsers.toLocaleString()}
          description="Profiles marked active"
          icon={Users}
        />
        <StatCard
          title={METRIC_LABELS.activeProducts}
          value={stats.totalProducts.toLocaleString()}
          description="Listed in catalog"
          icon={Package}
        />
        <StatCard
          title={`Orders · ${scope}`}
          value={stats.totalOrders.toLocaleString()}
          description="Excluding cancelled"
          icon={ShoppingCart}
        />
        <StatCard
          title={`Revenue · ${scope}`}
          value={formatPrice(stats.totalRevenue)}
          description="Excluding cancelled"
          icon={DollarSign}
        />
      </div>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={METRIC_LABELS.totalCarts}
          value={stats.activeCarts.toLocaleString()}
          description="All cart rows"
          icon={ShoppingCart}
        />
        <StatCard
          title="Average Order Value"
          value={formatPrice(stats.averageOrderValue)}
          description={`Per order · ${scope}`}
          icon={TrendingUp}
        />
        <StatCard
          title="Pending Reviews"
          value={stats.pendingReviews.toLocaleString()}
          description="Awaiting moderation"
          icon={Star}
        />
        <StatCard
          title={METRIC_LABELS.lowStockVariantsWithRange}
          value={stats.lowStockProducts.toLocaleString()}
          description="Variant stock in range"
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
