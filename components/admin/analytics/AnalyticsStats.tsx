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

const UNAVAILABLE = "—"

interface AnalyticsStatsProps {
  stats: AnalyticsStatsType | null
  statsOk: boolean
  rangeLabel?: string
}

export function AnalyticsStats({
  stats,
  statsOk,
  rangeLabel,
}: AnalyticsStatsProps) {
  const scope = rangeLabel ?? "All time"

  const formatNumber = (value: number | undefined) =>
    statsOk && value !== undefined ? value.toLocaleString() : UNAVAILABLE
  const formatCurrency = (value: number | undefined) =>
    statsOk && value !== undefined ? formatPrice(value) : UNAVAILABLE

  return (
    <div className="space-y-4">
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={METRIC_LABELS.activeUsers}
          value={formatNumber(stats?.totalUsers)}
          description="Profiles marked active"
          icon={Users}
        />
        <StatCard
          title={METRIC_LABELS.activeProducts}
          value={formatNumber(stats?.totalProducts)}
          description="Listed in catalog"
          icon={Package}
        />
        <StatCard
          title={`Orders · ${scope}`}
          value={formatNumber(stats?.totalOrders)}
          description="Excluding cancelled"
          icon={ShoppingCart}
        />
        <StatCard
          title={`Revenue · ${scope}`}
          value={formatCurrency(stats?.totalRevenue)}
          description="Excluding cancelled"
          icon={DollarSign}
        />
      </div>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={METRIC_LABELS.totalCarts}
          value={formatNumber(stats?.activeCarts)}
          description="All cart rows"
          icon={ShoppingCart}
        />
        <StatCard
          title="Average Order Value"
          value={formatCurrency(stats?.averageOrderValue)}
          description={`Per order · ${scope}`}
          icon={TrendingUp}
        />
        <StatCard
          title="Pending Reviews"
          value={formatNumber(stats?.pendingReviews)}
          description="Awaiting moderation"
          icon={Star}
        />
        <StatCard
          title={METRIC_LABELS.lowStockVariantsWithRange}
          value={formatNumber(stats?.lowStockProducts)}
          description="Variant stock in range"
          icon={AlertCircle}
        />
      </div>
      {statsOk && stats && stats.pendingContactUs > 0 && (
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
