import { AnalyticsCharts } from "@/components/admin/analytics/AnalyticsCharts"
import { AnalyticsStats } from "@/components/admin/analytics/AnalyticsStats"
import { AdminDateRangeControls } from "@/components/admin/AdminDateRangeControls"
import { parseAdminDateRange } from "@/lib/admin/date-range"
import {
  getSalesAndOrdersByMonthService,
  getUserGrowthByMonthService,
  getOrderStatusBreakdownService,
  getPaymentStatusBreakdownService,
  getAnalyticsStatsService,
  getTopProductsByRevenueService,
} from "@/services/analytics.service"

interface AnalyticsPageProps {
  searchParams: Promise<{
    from?: string
    to?: string
    preset?: string
  }>
}

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const params = await searchParams
  const range = parseAdminDateRange(params, { defaultPreset: "all" })
  const boundedRange =
    range.preset === "all" ? undefined : range

  const [
    salesData,
    userData,
    orderStatusData,
    paymentStatusData,
    stats,
    topProducts,
  ] = await Promise.all([
    getSalesAndOrdersByMonthService(boundedRange),
    getUserGrowthByMonthService(boundedRange),
    getOrderStatusBreakdownService(),
    getPaymentStatusBreakdownService(),
    getAnalyticsStatsService(boundedRange),
    getTopProductsByRevenueService(10, boundedRange),
  ])

  const salesChartData = salesData.map((item) => ({
    name: item.month,
    sales: Math.round(item.sales * 100) / 100,
    orders: item.orders,
  }))

  const userChartData = userData.map((item) => ({
    name: item.month,
    users: item.users,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          View sales, users, and order analytics · {range.label}
        </p>
      </div>

      <AdminDateRangeControls
        fromDate={range.fromDate}
        toDate={range.toDate}
        preset={range.preset}
        showAllTime
      />

      <AnalyticsStats stats={stats} rangeLabel={range.label} />

      <AnalyticsCharts
        salesData={salesChartData}
        userData={userChartData}
        orderStatusData={orderStatusData}
        paymentStatusData={paymentStatusData}
        topProducts={topProducts}
      />
    </div>
  )
}
