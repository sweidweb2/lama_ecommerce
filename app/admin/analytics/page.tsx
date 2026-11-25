import { AlertCircle } from "lucide-react"
import { AnalyticsCharts } from "@/components/admin/analytics/AnalyticsCharts"
import { AnalyticsStats } from "@/components/admin/analytics/AnalyticsStats"
import { AdminDateRangeControls } from "@/components/admin/AdminDateRangeControls"
import Link from "@/components/ui/link"
import {
  adminDateRangeHref,
  parseAdminDateRange,
} from "@/lib/admin/date-range"
import { getAnalyticsDashboardService } from "@/services/analytics.service"
import { ROUTES } from "@/lib/constants/routes"

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
  const boundedRange = range.preset === "all" ? undefined : range
  const reloadHref = adminDateRangeHref(ROUTES.ADMIN_HOME, range)

  const dashboard = await getAnalyticsDashboardService(boundedRange, 10)
  const hasFetchError = !dashboard.ok
  const data = dashboard.ok ? dashboard.data : null

  const salesData = data?.sales ?? []
  const userData = data?.userGrowth ?? []
  const orderStatusData = data?.orderStatus ?? []
  const paymentStatusData = data?.paymentStatus ?? []
  const topProducts = data?.topProducts ?? []
  const statsOk = dashboard.ok
  const stats = data?.stats ?? null

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

      {hasFetchError && (
        <div
          role="alert"
          className="flex flex-col gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-2 text-sm">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <div>
              <p className="font-medium text-destructive">
                Some analytics data could not be loaded
              </p>
              <p className="text-muted-foreground mt-0.5">
                {!dashboard.ok ? dashboard.error : null}
              </p>
            </div>
          </div>
          <Link
            href={reloadHref}
            className="shrink-0 text-sm font-medium text-primary hover:underline"
          >
            Reload
          </Link>
        </div>
      )}

      <AnalyticsStats
        stats={stats}
        statsOk={statsOk}
        rangeLabel={range.label}
      />

      <AnalyticsCharts
        salesData={salesChartData}
        userData={userChartData}
        orderStatusData={orderStatusData}
        paymentStatusData={paymentStatusData}
        topProducts={topProducts}
        salesError={hasFetchError}
        userError={hasFetchError}
        orderStatusError={hasFetchError}
        paymentStatusError={hasFetchError}
        topProductsError={hasFetchError}
      />
    </div>
  )
}
