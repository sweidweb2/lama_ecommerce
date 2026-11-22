import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AdminDateRange } from "@/lib/admin/date-range";
import {
  LOW_STOCK_MAX,
  LOW_STOCK_MIN,
  REVENUE_EXCLUDED_STATUSES,
} from "@/lib/admin/metric-definitions";

const ORDER_STATUSES = [
  "pending",
  "processing",
  "packed",
  "shipped",
  "delivered",
  "returned",
  "cancelled",
] as const;

const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"] as const;

type QueryResult = { error: { message: string } | null };

function assertNoQueryErrors(
  labeled: Array<{ label: string; result: QueryResult }>,
): void {
  const failed = labeled.filter(({ result }) => result.error);
  if (failed.length === 0) return;
  const detail = failed
    .map(({ label, result }) => `${label}: ${result.error!.message}`)
    .join("; ");
  throw new Error(`Analytics query failed (${detail})`);
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function monthKeyFromUtc(date: Date): string {
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}`;
}

function monthStartUtc(year: number, monthIndex: number): Date {
  return new Date(Date.UTC(year, monthIndex, 1));
}

function parseMonthKey(key: string): { year: number; monthIndex: number } {
  const [y, m] = key.split("-").map(Number);
  return { year: y, monthIndex: m - 1 };
}

/**
 * Fixed UTC `YYYY-MM` keys for a reporting window.
 * Default: last 6 calendar months including the current UTC month.
 */
export function listUtcMonthKeysForRange(
  range?: AdminDateRange,
  defaultMonthCount = 6,
): string[] {
  let start: Date;
  let endExclusive: Date;

  if (range?.fromIso || range?.toIsoExclusive) {
    start = range.fromIso
      ? new Date(range.fromIso)
      : monthStartUtc(new Date().getUTCFullYear(), new Date().getUTCMonth());
    endExclusive = range.toIsoExclusive
      ? new Date(range.toIsoExclusive)
      : new Date();
  } else {
    endExclusive = new Date();
    start = monthStartUtc(
      endExclusive.getUTCFullYear(),
      endExclusive.getUTCMonth() - (defaultMonthCount - 1),
    );
  }

  const cursor = monthStartUtc(start.getUTCFullYear(), start.getUTCMonth());
  const lastInclusive = new Date(
    Math.max(endExclusive.getTime() - 1, start.getTime()),
  );
  const endCursor = monthStartUtc(
    lastInclusive.getUTCFullYear(),
    lastInclusive.getUTCMonth(),
  );

  const keys: string[] = [];
  while (cursor.getTime() <= endCursor.getTime()) {
    keys.push(monthKeyFromUtc(cursor));
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return keys;
}

function applyCreatedAtRange<
  T extends {
    gte: (column: string, value: string) => T;
    lt: (column: string, value: string) => T;
  },
>(
  query: T,
  fromIso: string | null | undefined,
  toIsoExclusive: string | null | undefined,
): T {
  let next = query;
  if (fromIso) next = next.gte("created_at", fromIso);
  if (toIsoExclusive) next = next.lt("created_at", toIsoExclusive);
  return next;
}

function applyRevenueStatusFilter<
  T extends { neq: (column: string, value: string) => T },
>(query: T): T {
  let next = query;
  for (const status of REVENUE_EXCLUDED_STATUSES) {
    next = next.neq("status", status);
  }
  return next;
}

function roundMoney(value: unknown): number {
  return Math.round(Number(value || 0) * 100) / 100;
}

function titleCaseStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

/**
 * Get sales and orders data grouped by month (exact per-month aggregates).
 * Uses the provided range, or the last 6 months when unset. Zero-fills empty months.
 */
export async function getSalesAndOrdersByMonth(
  range?: AdminDateRange,
): Promise<Array<{ month: string; sales: number; orders: number }>> {
  const supabase = createSupabaseAdminClient();
  const monthKeys = listUtcMonthKeysForRange(range);
  if (monthKeys.length === 0) return [];

  const first = parseMonthKey(monthKeys[0]);
  const last = parseMonthKey(monthKeys[monthKeys.length - 1]);
  const fromIso = monthStartUtc(first.year, first.monthIndex).toISOString();
  const toIsoExclusive = monthStartUtc(
    last.year,
    last.monthIndex + 1,
  ).toISOString();

  const { data, error } = await supabase.rpc("admin_orders_by_month", {
    p_from: fromIso,
    p_to_exclusive: toIsoExclusive,
  });
  assertNoQueryErrors([{ label: "ordersByMonth", result: { error } }]);

  const byMonth = new Map<string, { sales: number; orders: number }>();
  for (const row of data ?? []) {
    const r = row as {
      month: string;
      orders: number | string;
      sales: number | string;
    };
    byMonth.set(r.month, {
      orders: Number(r.orders || 0),
      sales: roundMoney(r.sales),
    });
  }

  return monthKeys.map((month) => ({
    month,
    orders: byMonth.get(month)?.orders ?? 0,
    sales: byMonth.get(month)?.sales ?? 0,
  }));
}

/**
 * Get user growth data grouped by month (exact per-month counts).
 * Uses the provided range, or the last 6 months when unset. Zero-fills empty months.
 */
export async function getUserGrowthByMonth(
  range?: AdminDateRange,
): Promise<Array<{ month: string; users: number }>> {
  const supabase = createSupabaseAdminClient();
  const monthKeys = listUtcMonthKeysForRange(range);
  if (monthKeys.length === 0) return [];

  const first = parseMonthKey(monthKeys[0]);
  const last = parseMonthKey(monthKeys[monthKeys.length - 1]);
  const fromIso = monthStartUtc(first.year, first.monthIndex).toISOString();
  const toIsoExclusive = monthStartUtc(
    last.year,
    last.monthIndex + 1,
  ).toISOString();

  const { data, error } = await supabase.rpc("admin_users_by_month", {
    p_from: fromIso,
    p_to_exclusive: toIsoExclusive,
  });
  assertNoQueryErrors([{ label: "usersByMonth", result: { error } }]);

  const byMonth = new Map<string, number>();
  for (const row of data ?? []) {
    const r = row as { month: string; users: number | string };
    byMonth.set(r.month, Number(r.users || 0));
  }

  return monthKeys.map((month) => ({
    month,
    users: byMonth.get(month) ?? 0,
  }));
}

/**
 * Get order status breakdown (exact head count per status).
 */
export async function getOrderStatusBreakdown(): Promise<
  Array<{ status: string; count: number }>
> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("admin_order_status_counts");
  assertNoQueryErrors([{ label: "orderStatus", result: { error } }]);

  const byStatus = new Map<string, number>();
  for (const row of data ?? []) {
    const r = row as { status: string; count: number | string };
    byStatus.set(r.status, Number(r.count || 0));
  }

  return ORDER_STATUSES.map((status) => ({
    status: titleCaseStatus(status),
    count: byStatus.get(status) ?? 0,
  })).filter((row) => row.count > 0);
}

/**
 * Get payment status breakdown (exact head count per payment_status).
 */
export async function getPaymentStatusBreakdown(): Promise<
  Array<{ status: string; count: number }>
> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("admin_payment_status_counts");
  assertNoQueryErrors([{ label: "paymentStatus", result: { error } }]);

  const byStatus = new Map<string, number>();
  for (const row of data ?? []) {
    const r = row as { status: string; count: number | string };
    byStatus.set(r.status, Number(r.count || 0));
  }

  return PAYMENT_STATUSES.map((status) => ({
    status: titleCaseStatus(status),
    count: byStatus.get(status) ?? 0,
  })).filter((row) => row.count > 0);
}

/**
 * Get overall statistics
 */
export interface AnalyticsStats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  activeCarts: number;
  pendingReviews: number;
  pendingContactUs: number;
  lowStockProducts: number;
  averageOrderValue: number;
}

/**
 * Get overall statistics.
 * When `range` is provided (and not all-time), order/revenue/AOV are scoped to that range.
 * Order KPIs exclude cancelled and use exact count / RPC sum (no row dump).
 */
export async function getAnalyticsStats(
  range?: AdminDateRange,
): Promise<AnalyticsStats> {
  const supabase = createSupabaseAdminClient();
  const hasBoundedRange = Boolean(range?.fromIso || range?.toIsoExclusive);
  const fromIso = hasBoundedRange ? (range?.fromIso ?? null) : null;
  const toIsoExclusive = hasBoundedRange
    ? (range?.toIsoExclusive ?? null)
    : null;

  const ordersCountQuery = applyRevenueStatusFilter(
    applyCreatedAtRange(
      supabase.from("orders").select("id", { count: "exact", head: true }),
      fromIso,
      toIsoExclusive,
    ),
  );

  const [
    usersRes,
    productsRes,
    ordersCountRes,
    ordersSumRes,
    cartsRes,
    pendingReviewsRes,
    pendingContactRes,
    lowStockRes,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true),
    supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true),
    ordersCountQuery,
    supabase.rpc("admin_orders_revenue_sum", {
      p_from: fromIso,
      p_to_exclusive: toIsoExclusive,
    }),
    supabase.from("carts").select("id", { count: "exact", head: true }),
    supabase
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .eq("review_status", "pending"),
    supabase
      .from("contact_us")
      .select("id", { count: "exact", head: true })
      .in("status", ["new", "read"]),
    supabase
      .from("customised_products")
      .select("id", { count: "exact", head: true })
      .gte("quantity_stock", LOW_STOCK_MIN)
      .lte("quantity_stock", LOW_STOCK_MAX),
  ]);

  assertNoQueryErrors([
    { label: "users", result: usersRes },
    { label: "products", result: productsRes },
    { label: "ordersCount", result: ordersCountRes },
    { label: "ordersSum", result: ordersSumRes },
    { label: "carts", result: cartsRes },
    { label: "pendingReviews", result: pendingReviewsRes },
    { label: "pendingContact", result: pendingContactRes },
    { label: "lowStock", result: lowStockRes },
  ]);

  const totalOrders = ordersCountRes.count || 0;
  const totalRevenue = roundMoney(ordersSumRes.data);
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return {
    totalUsers: usersRes.count || 0,
    totalProducts: productsRes.count || 0,
    totalOrders,
    totalRevenue,
    activeCarts: cartsRes.count || 0,
    pendingReviews: pendingReviewsRes.count || 0,
    pendingContactUs: pendingContactRes.count || 0,
    lowStockProducts: lowStockRes.count || 0,
    averageOrderValue,
  };
}

/**
 * Get top products by revenue via SQL RPC (excludes cancelled; optional date range).
 */
export async function getTopProductsByRevenue(
  limit: number = 10,
  range?: AdminDateRange,
): Promise<
  Array<{
    product_id: string;
    product_name: string;
    revenue: number;
    orders: number;
  }>
> {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await (supabase as any).rpc(
    "admin_top_products_by_revenue",
    {
      p_limit: limit,
      p_from: range?.fromIso ?? null,
      p_to_exclusive: range?.toIsoExclusive ?? null,
    },
  );

  if (error) {
    throw new Error(`Analytics query failed (topProducts: ${error.message})`);
  }

  return (data ?? []).map(
    (row: {
      product_id: string;
      product_name: string;
      revenue: number | string;
      order_count: number | string;
    }) => ({
      product_id: row.product_id,
      product_name: row.product_name,
      revenue: Math.round(Number(row.revenue || 0) * 100) / 100,
      orders: Number(row.order_count || 0),
    }),
  );
}
