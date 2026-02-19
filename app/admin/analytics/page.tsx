import { AnalyticsCharts } from "@/components/admin/analytics/AnalyticsCharts"
import { AnalyticsStats } from "@/components/admin/analytics/AnalyticsStats"
import {
  getSalesAndOrdersByMonthService,
  getUserGrowthByMonthService,
  getOrderStatusBreakdownService,
  getPaymentStatusBreakdownService,
  getAnalyticsStatsService,
  getTopProductsByRevenueService,
} from "@/services/analytics.service"

export default async function AnalyticsPage() {
  // Fetch all analytics data in parallel
  const [
    salesData,
    userData,
    orderStatusData,
    paymentStatusData,
    stats,
    topProducts,
  ] = await Promise.all([
    getSalesAndOrdersByMonthService(),
    getUserGrowthByMonthService(),
    getOrderStatusBreakdownService(),
    getPaymentStatusBreakdownService(),
    getAnalyticsStatsService(),
    getTopProductsByRevenueService(10),
  ])

  // Transform data for charts
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
          View sales, users, and order analytics
        </p>
      </div>

      <AnalyticsStats stats={stats} />

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
