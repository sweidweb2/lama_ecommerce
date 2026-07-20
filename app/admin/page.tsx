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
  Mail,
  Warehouse,
  UserPlus,
  Boxes,
} from "lucide-react"
import {
  getDashboardStatsService,
  getRecentOrdersService,
  getRecentUsersService,
  getLowStockItemsService,
  getPendingReviewsPreviewService,
  getUnansweredQuestionsPreviewService,
  getRecentContactsService,
  getTopSellingProductsService,
  getOrderStatusBreakdownService,
  type DashboardResult,
} from "@/services/dashboard.service"
import Link from "@/components/ui/link"
import { Badge } from "@/components/ui/badge"
import { encryptOrderId } from "@/lib/utils/encryption"
import { AdminBreadcrumbs } from "@/components/admin/AdminBreadcrumbs"
import { computeMomTrend } from "@/lib/admin/mom"

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

  if (diffInSeconds < 60) return `${diffInSeconds}s ago`
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes}m ago`
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours}h ago`
  }
  const days = Math.floor(diffInSeconds / 86400)
  return `${days}d ago`
}

function getStatusBadgeVariant(
  status: string,
): "default" | "secondary" | "outline" | "destructive" {
  switch (status.toLowerCase()) {
    case "pending":
    case "new":
      return "secondary"
    case "processing":
    case "packed":
    case "read":
      return "default"
    case "shipped":
    case "delivered":
    case "replied":
    case "resolved":
    case "paid":
      return "outline"
    case "cancelled":
    case "returned":
    case "failed":
      return "destructive"
    default:
      return "secondary"
  }
}

const UNAVAILABLE = "—"

function unwrapOrEmpty<T>(result: DashboardResult<T>, empty: T): T {
  return result.ok ? result.data : empty
}

export default async function AdminDashboard() {
  const [
    statsResult,
    recentOrdersResult,
    recentUsersResult,
    lowStockResult,
    pendingReviewsResult,
    unansweredQuestionsResult,
    recentContactsResult,
    topProductsResult,
    orderStatusesResult,
  ] = await Promise.all([
    getDashboardStatsService(),
    getRecentOrdersService(6),
    getRecentUsersService(5),
    getLowStockItemsService(8),
    getPendingReviewsPreviewService(5),
    getUnansweredQuestionsPreviewService(5),
    getRecentContactsService(5),
    getTopSellingProductsService(5),
    getOrderStatusBreakdownService(),
  ])

  const fetchResults = [
    { label: "stats", result: statsResult },
    { label: "recent orders", result: recentOrdersResult },
    { label: "recent users", result: recentUsersResult },
    { label: "low stock", result: lowStockResult },
    { label: "pending reviews", result: pendingReviewsResult },
    { label: "unanswered Q&A", result: unansweredQuestionsResult },
    { label: "contacts", result: recentContactsResult },
    { label: "top sellers", result: topProductsResult },
    { label: "order status", result: orderStatusesResult },
  ]
  const failedFetches = fetchResults.filter(({ result }) => !result.ok)
  const hasFetchError = failedFetches.length > 0
  const statsOk = statsResult.ok
  const stats = statsOk ? statsResult.data : null
  const orderStatusesOk = orderStatusesResult.ok
  const orderStatuses = unwrapOrEmpty(orderStatusesResult, [])
  const recentOrders = unwrapOrEmpty(recentOrdersResult, [])
  const recentUsers = unwrapOrEmpty(recentUsersResult, [])
  const lowStock = unwrapOrEmpty(lowStockResult, [])
  const pendingReviews = unwrapOrEmpty(pendingReviewsResult, [])
  const unansweredQuestions = unwrapOrEmpty(unansweredQuestionsResult, [])
  const recentContacts = unwrapOrEmpty(recentContactsResult, [])
  const topProducts = unwrapOrEmpty(topProductsResult, [])

  const attentionTotal = stats
    ? stats.pendingOrders +
      stats.lowStockItems +
      stats.outOfStockItems +
      stats.unansweredQA +
      stats.pendingReviews +
      stats.newContacts
    : 0

  const formatStatNumber = (value: number | undefined) =>
    statsOk && value !== undefined ? formatNumber(value) : UNAVAILABLE
  const formatStatCurrency = (value: number | undefined) =>
    statsOk && value !== undefined ? formatCurrency(value) : UNAVAILABLE
  const formatStatRaw = (value: number | undefined) =>
    statsOk && value !== undefined ? value : UNAVAILABLE

  const ordersTrend = stats
    ? computeMomTrend(stats.totalOrdersThisMonth, stats.ordersLastMonth)
    : undefined
  const revenueTrend = stats
    ? computeMomTrend(stats.revenueThisMonth, stats.revenueLastMonth)
    : undefined

  return (
    <div className="space-y-6">
      <AdminBreadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Dashboard" }]} />

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Live overview from your store database
          {statsOk && attentionTotal > 0
            ? ` · ${formatNumber(attentionTotal)} items need attention`
            : ""}
        </p>
      </div>

      {hasFetchError && (
        <div
          role="alert"
          className="flex flex-col gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-2 text-sm">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <div>
              <p className="font-medium text-destructive">
                Some dashboard data could not be loaded
              </p>
              <p className="text-muted-foreground mt-0.5">
                {failedFetches
                  .map(({ label, result }) =>
                    !result.ok ? `${label}: ${result.error}` : null,
                  )
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
          </div>
          <Link
            href="/admin"
            className="shrink-0 text-sm font-medium text-primary hover:underline"
          >
            Reload
          </Link>
        </div>
      )}

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active users"
          value={formatStatNumber(stats?.totalUsers)}
          description="Profiles marked active"
          icon={Users}
        />
        <StatCard
          title="Active products"
          value={formatStatNumber(stats?.totalProducts)}
          description="Listed in catalog"
          icon={Package}
        />
        <StatCard
          title="Orders this month"
          value={formatStatNumber(stats?.totalOrdersThisMonth)}
          description={
            statsOk
              ? `${formatNumber(stats!.pendingOrders)} pending`
              : "Unavailable"
          }
          icon={ShoppingCart}
          trend={ordersTrend}
        />
        <StatCard
          title="Revenue this month"
          value={formatStatCurrency(stats?.revenueThisMonth)}
          description="From order totals"
          icon={DollarSign}
          trend={revenueTrend}
        />
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <Link
          href="/admin/orders?status=pending"
          className="rounded-lg border bg-card p-4 shadow-sm hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
            <Clock className="h-3.5 w-3.5 text-orange-500" />
            Pending orders
          </div>
          <p className="text-xl font-bold mt-2">{formatStatRaw(stats?.pendingOrders)}</p>
        </Link>
        <Link
          href="/admin/orders?status=fulfillment"
          className="rounded-lg border bg-card p-4 shadow-sm hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
            <Boxes className="h-3.5 w-3.5 text-sky-500" />
            In fulfillment
          </div>
          <p className="text-xl font-bold mt-2">{formatStatRaw(stats?.processingOrders)}</p>
        </Link>
        <Link
          href="/admin/products?stock=low"
          className="rounded-lg border bg-card p-4 shadow-sm hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
            <AlertCircle className="h-3.5 w-3.5 text-yellow-500" />
            Low stock
          </div>
          <p className="text-xl font-bold mt-2">{formatStatRaw(stats?.lowStockItems)}</p>
        </Link>
        <Link
          href="/admin/products?stock=out"
          className="rounded-lg border bg-card p-4 shadow-sm hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
            <Warehouse className="h-3.5 w-3.5 text-red-500" />
            Out of stock
          </div>
          <p className="text-xl font-bold mt-2">{formatStatRaw(stats?.outOfStockItems)}</p>
        </Link>
        <Link
          href="/admin/qa"
          className="rounded-lg border bg-card p-4 shadow-sm hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
            <MessageSquare className="h-3.5 w-3.5 text-blue-500" />
            Open Q&A
          </div>
          <p className="text-xl font-bold mt-2">{formatStatRaw(stats?.unansweredQA)}</p>
        </Link>
        <Link
          href="/admin/reviews"
          className="rounded-lg border bg-card p-4 shadow-sm hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
            <Star className="h-3.5 w-3.5 text-purple-500" />
            Pending reviews
          </div>
          <p className="text-xl font-bold mt-2">{formatStatRaw(stats?.pendingReviews)}</p>
        </Link>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Link
          href="/admin/contact"
          className="rounded-lg border bg-card p-4 shadow-sm hover:bg-muted/50 transition-colors flex items-center justify-between"
        >
          <div>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Mail className="h-4 w-4" /> New contact messages
            </p>
            <p className="text-2xl font-bold mt-1">{formatStatRaw(stats?.newContacts)}</p>
          </div>
        </Link>
        <Link
          href="/admin/leads"
          className="rounded-lg border bg-card p-4 shadow-sm hover:bg-muted/50 transition-colors flex items-center justify-between"
        >
          <div>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <UserPlus className="h-4 w-4" /> Leads this month
            </p>
            <p className="text-2xl font-bold mt-1">{formatStatRaw(stats?.newLeadsThisMonth)}</p>
          </div>
        </Link>
        <Link
          href="/admin/carts"
          className="rounded-lg border bg-card p-4 shadow-sm hover:bg-muted/50 transition-colors flex items-center justify-between"
        >
          <div>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" /> Active carts
            </p>
            <p className="text-2xl font-bold mt-1">{formatStatRaw(stats?.activeCarts)}</p>
          </div>
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Recent orders</h3>
            <Link href="/admin/orders" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-2 max-h-[360px] overflow-y-auto">
            {!recentOrdersResult.ok ? (
              <p className="text-sm text-destructive">Could not load recent orders</p>
            ) : recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No orders yet</p>
            ) : (
              recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/orders/${encryptOrderId(order.id)}`}
                  className="flex items-center justify-between rounded-md p-2 hover:bg-muted/50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      #{order.id.slice(0, 8)} · {order.userName}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <Badge variant={getStatusBadgeVariant(order.status)} className="text-xs">
                        {order.status}
                      </Badge>
                      <Badge
                        variant={getStatusBadgeVariant(order.payment_status)}
                        className="text-xs"
                      >
                        {order.payment_status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatCurrency(order.total)} · {formatTimeAgo(order.created_at)}
                      </span>
                    </div>
                  </div>
                  <TrendingUp className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Order status mix</h3>
            <Link href="/admin/orders" className="text-sm text-primary hover:underline">
              Manage
            </Link>
          </div>
          {!orderStatusesOk ? (
            <p className="text-sm text-destructive">Could not load order status mix</p>
          ) : orderStatuses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No order data</p>
          ) : (
            <div className="space-y-3">
              {orderStatuses.map((row) => {
                const total = orderStatuses.reduce((s, r) => s + r.count, 0) || 1
                const pct = Math.round((row.count / total) * 100)
                return (
                  <div key={row.status}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="capitalize font-medium">{row.status}</span>
                      <span className="text-muted-foreground">
                        {row.count} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary/80"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Top sellers this month</h3>
            <Link href="/admin/products" className="text-sm text-primary hover:underline">
              Catalog
            </Link>
          </div>
          {!topProductsResult.ok ? (
            <p className="text-sm text-destructive">Could not load top sellers</p>
          ) : topProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sales this month</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((product, index) => (
                <div
                  key={product.productName}
                  className="flex items-center justify-between gap-3 rounded-md p-2 hover:bg-muted/40"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-bold text-muted-foreground w-5">
                      #{index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{product.productName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatNumber(product.unitsSold)} units
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold shrink-0">
                    {formatCurrency(product.revenue)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Low stock variants</h3>
            <Link href="/admin/products?stock=low" className="text-sm text-primary hover:underline">
              Restock
            </Link>
          </div>
          {!lowStockResult.ok ? (
            <p className="text-sm text-destructive">Could not load low stock</p>
          ) : lowStock.length === 0 ? (
            <p className="text-sm text-muted-foreground">No low-stock variants</p>
          ) : (
            <div className="space-y-2 max-h-[320px] overflow-y-auto">
              {lowStock.map((item) => (
                <Link
                  key={item.id}
                  href={`/admin/products/${encryptOrderId(item.productId)}`}
                  className="flex items-center justify-between rounded-md p-2 hover:bg-muted/50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{item.productName}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.sku_variant || item.id.slice(0, 8)}
                    </p>
                  </div>
                  <Badge
                    variant={item.quantity_stock <= 3 ? "destructive" : "secondary"}
                    className="shrink-0"
                  >
                    {item.quantity_stock} left
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Pending reviews</h3>
            <Link href="/admin/reviews" className="text-sm text-primary hover:underline">
              Moderate
            </Link>
          </div>
          {!pendingReviewsResult.ok ? (
            <p className="text-sm text-destructive">Could not load reviews</p>
          ) : pendingReviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">Queue is clear</p>
          ) : (
            <div className="space-y-3">
              {pendingReviews.map((review) => (
                <Link
                  key={review.id}
                  href={`/admin/products/${encryptOrderId(review.productId)}`}
                  className="block rounded-md p-2 hover:bg-muted/50 transition-colors"
                >
                  <p className="text-sm font-medium truncate">{review.productName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {review.rating}/5 · {review.title || "No title"} ·{" "}
                    {formatTimeAgo(review.created_at)}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Unanswered Q&A</h3>
            <Link href="/admin/qa" className="text-sm text-primary hover:underline">
              Answer
            </Link>
          </div>
          {!unansweredQuestionsResult.ok ? (
            <p className="text-sm text-destructive">Could not load Q&A</p>
          ) : unansweredQuestions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No open questions</p>
          ) : (
            <div className="space-y-3">
              {unansweredQuestions.map((q) => (
                <Link
                  key={q.id}
                  href={`/admin/products/${encryptOrderId(q.productId)}`}
                  className="block rounded-md p-2 hover:bg-muted/50 transition-colors"
                >
                  <p className="text-sm font-medium truncate">{q.productName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {q.question}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {formatTimeAgo(q.created_at)}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Inbox & users</h3>
            <Link href="/admin/contact" className="text-sm text-primary hover:underline">
              Inbox
            </Link>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Latest contacts
              </p>
              {!recentContactsResult.ok ? (
                <p className="text-sm text-destructive">Could not load contacts</p>
              ) : recentContacts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No messages</p>
              ) : (
                <div className="space-y-2">
                  {recentContacts.map((c) => (
                    <Link
                      key={c.id}
                      href={`/admin/contact?id=${c.id}`}
                      className="block rounded-md p-2 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium truncate">
                          {c.full_name || c.email || "Anonymous"}
                        </p>
                        <Badge variant={getStatusBadgeVariant(c.status)} className="text-[10px]">
                          {c.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {c.subject || "No subject"} · {formatTimeAgo(c.created_at)}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Newest users
                </p>
                <Link href="/admin/users" className="text-xs text-primary hover:underline">
                  All
                </Link>
              </div>
              {!recentUsersResult.ok ? (
                <p className="text-sm text-destructive">Could not load users</p>
              ) : recentUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No users</p>
              ) : (
                <div className="space-y-2">
                  {recentUsers.map((user) => (
                    <div
                      key={user.user_id}
                      className="flex items-center justify-between rounded-md p-2 hover:bg-muted/40"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {user.full_name || "Unknown"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user.email || formatTimeAgo(user.created_at)}
                        </p>
                      </div>
                      <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
