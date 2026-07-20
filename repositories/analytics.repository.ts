import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AdminDateRange } from "@/lib/admin/date-range";
import {
  LOW_STOCK_MAX,
  LOW_STOCK_MIN,
  REVENUE_EXCLUDED_STATUSES,
} from "@/lib/admin/metric-definitions";

function applyCreatedAtRange<T extends {
  gte: (column: string, value: string) => T;
  lt: (column: string, value: string) => T;
}>(
  query: T,
  range: AdminDateRange | undefined,
): T {
  let next = query;
  if (range?.fromIso) next = next.gte("created_at", range.fromIso);
  if (range?.toIsoExclusive) next = next.lt("created_at", range.toIsoExclusive);
  return next;
}

function applyRevenueStatusFilter<T extends {
  neq: (column: string, value: string) => T;
}>(query: T): T {
  let next = query;
  for (const status of REVENUE_EXCLUDED_STATUSES) {
    next = next.neq("status", status);
  }
  return next;
}

/**
 * Get sales and orders data grouped by month.
 * Uses the provided range, or the last 6 months when unset.
 */
export async function getSalesAndOrdersByMonth(
  range?: AdminDateRange,
): Promise<Array<{ month: string; sales: number; orders: number }>> {
  try {
    const supabase = createSupabaseAdminClient();

    let query = supabase.from("orders").select("total, created_at, status");
    if (range?.fromIso || range?.toIsoExclusive) {
      query = applyCreatedAtRange(query, range);
    } else {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setUTCMonth(sixMonthsAgo.getUTCMonth() - 6);
      query = query.gte("created_at", sixMonthsAgo.toISOString());
    }
    query = applyRevenueStatusFilter(query);

    const { data: orders, error } = await query;

    if (error) {
      console.error("Error fetching sales data:", error);
      return [];
    }

    const monthlyData = new Map<string, { sales: number; orders: number }>();

    (orders || []).forEach((order) => {
      const date = new Date(order.created_at);
      const monthKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
      const total = parseFloat(String(order.total || 0));

      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { sales: 0, orders: 0 });
      }

      const data = monthlyData.get(monthKey)!;
      data.sales += total;
      data.orders += 1;
    });

    return Array.from(monthlyData.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month));
  } catch (error) {
    console.error("Unexpected error in getSalesAndOrdersByMonth:", error);
    return [];
  }
}

/**
 * Get user growth data grouped by month.
 * Uses the provided range, or the last 6 months when unset.
 */
export async function getUserGrowthByMonth(
  range?: AdminDateRange,
): Promise<Array<{ month: string; users: number }>> {
  try {
    const supabase = createSupabaseAdminClient();

    let query = supabase
      .from("profiles")
      .select("created_at")
      .eq("is_active", true);
    if (range?.fromIso || range?.toIsoExclusive) {
      query = applyCreatedAtRange(query, range);
    } else {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setUTCMonth(sixMonthsAgo.getUTCMonth() - 6);
      query = query.gte("created_at", sixMonthsAgo.toISOString());
    }

    const { data: profiles, error } = await query;

    if (error) {
      console.error("Error fetching user growth data:", error);
      return [];
    }

    const monthlyData = new Map<string, number>();

    (profiles || []).forEach((profile) => {
      const date = new Date(profile.created_at);
      const monthKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
      monthlyData.set(monthKey, (monthlyData.get(monthKey) || 0) + 1);
    });

    return Array.from(monthlyData.entries())
      .map(([month, users]) => ({ month, users }))
      .sort((a, b) => a.month.localeCompare(b.month));
  } catch (error) {
    console.error("Unexpected error in getUserGrowthByMonth:", error);
    return [];
  }
}

/**
 * Get order status breakdown
 */
export async function getOrderStatusBreakdown(): Promise<
  Array<{ status: string; count: number }>
> {
  try {
    const supabase = createSupabaseAdminClient();

    const { data: orders, error } = await supabase
      .from("orders")
      .select("status");

    if (error) {
      console.error("Error fetching order status data:", error);
      return [];
    }

    const statusCounts = new Map<string, number>();

    (orders || []).forEach((order) => {
      const status = order.status;
      statusCounts.set(status, (statusCounts.get(status) || 0) + 1);
    });

    return Array.from(statusCounts.entries()).map(([status, count]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      count,
    }));
  } catch (error) {
    console.error("Unexpected error in getOrderStatusBreakdown:", error);
    return [];
  }
}

/**
 * Get payment status breakdown
 */
export async function getPaymentStatusBreakdown(): Promise<
  Array<{ status: string; count: number }>
> {
  try {
    const supabase = createSupabaseAdminClient();

    const { data: orders, error } = await supabase
      .from("orders")
      .select("payment_status");

    if (error) {
      console.error("Error fetching payment status data:", error);
      return [];
    }

    const statusCounts = new Map<string, number>();

    (orders || []).forEach((order) => {
      const status = order.payment_status;
      statusCounts.set(status, (statusCounts.get(status) || 0) + 1);
    });

    return Array.from(statusCounts.entries()).map(([status, count]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      count,
    }));
  } catch (error) {
    console.error("Unexpected error in getPaymentStatusBreakdown:", error);
    return [];
  }
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
 */
export async function getAnalyticsStats(
  range?: AdminDateRange,
): Promise<AnalyticsStats> {
  try {
    const supabase = createSupabaseAdminClient();
    const hasBoundedRange = Boolean(range?.fromIso || range?.toIsoExclusive);

    let ordersQuery = supabase.from("orders").select("total, status");
    if (hasBoundedRange) {
      ordersQuery = applyCreatedAtRange(ordersQuery, range);
    }
    ordersQuery = applyRevenueStatusFilter(ordersQuery);

    const [
      { count: userCount },
      { count: productCount },
      { data: orders },
      { count: cartsCount },
      { count: pendingReviewsCount },
      { count: pendingContactCount },
      { count: lowStockCount },
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true),
      supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true),
      ordersQuery,
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

    const totalRevenue =
      (orders || []).reduce((sum, order) => {
        return sum + parseFloat(String(order.total || 0));
      }, 0) || 0;

    const orderCount = (orders || []).length;
    const averageOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;

    return {
      totalUsers: userCount || 0,
      totalProducts: productCount || 0,
      totalOrders: orderCount,
      totalRevenue,
      activeCarts: cartsCount || 0,
      pendingReviews: pendingReviewsCount || 0,
      pendingContactUs: pendingContactCount || 0,
      lowStockProducts: lowStockCount || 0,
      averageOrderValue,
    };
  } catch (error) {
    console.error("Unexpected error in getAnalyticsStats:", error);
    return {
      totalUsers: 0,
      totalProducts: 0,
      totalOrders: 0,
      totalRevenue: 0,
      activeCarts: 0,
      pendingReviews: 0,
      pendingContactUs: 0,
      lowStockProducts: 0,
      averageOrderValue: 0,
    };
  }
}

/**
 * Get top products by revenue.
 * When `range` is provided, only orders in that range (excluding cancelled) are used.
 */
export async function getTopProductsByRevenue(
  limit: number = 10,
  range?: AdminDateRange,
): Promise<
  Array<{ product_id: string; product_name: string; revenue: number; orders: number }>
> {
  try {
    const supabase = createSupabaseAdminClient();

    let ordersQuery = supabase.from("orders").select("id");
    if (range?.fromIso || range?.toIsoExclusive) {
      ordersQuery = applyCreatedAtRange(ordersQuery, range);
    }
    ordersQuery = applyRevenueStatusFilter(ordersQuery);

    const { data: orders, error: ordersError } = await ordersQuery;
    if (ordersError || !orders?.length) {
      return [];
    }

    const orderIds = orders.map((o) => o.id);
    const { data: orderItems, error } = await supabase
      .from("order_items")
      .select("product_name_snapshot, price_snapshot, quantity, order_id")
      .in("order_id", orderIds);

    if (error) {
      console.error("Error fetching top products:", error);
      return [];
    }

    const productRevenue = new Map<
      string,
      { product_name: string; revenue: number; orders: Set<string> }
    >();

    (orderItems || []).forEach((item) => {
      const productName = item.product_name_snapshot || "Unknown Product";
      const price = parseFloat(String(item.price_snapshot || 0));
      const quantity = Number(item.quantity || 0);
      const revenue = price * quantity;

      if (!productRevenue.has(productName)) {
        productRevenue.set(productName, {
          product_name: productName,
          revenue: 0,
          orders: new Set(),
        });
      }

      const data = productRevenue.get(productName)!;
      data.revenue += revenue;
      data.orders.add(item.order_id);
    });

    return Array.from(productRevenue.entries())
      .map(([product_name, data]) => ({
        product_id: product_name,
        product_name,
        revenue: data.revenue,
        orders: data.orders.size,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  } catch (error) {
    console.error("Unexpected error in getTopProductsByRevenue:", error);
    return [];
  }
}

