import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Get sales and orders data grouped by month for the last 6 months
 */
export async function getSalesAndOrdersByMonth(): Promise<
  Array<{ month: string; sales: number; orders: number }>
> {
  try {
    const supabase = createSupabaseAdminClient();

    // Get orders from the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { data: orders, error } = await supabase
      .from("orders")
      .select("total, created_at")
      .gte("created_at", sixMonthsAgo.toISOString());

    if (error) {
      console.error("Error fetching sales data:", error);
      return [];
    }

    // Group by month
    const monthlyData = new Map<string, { sales: number; orders: number }>();

    (orders || []).forEach((order) => {
      const date = new Date(order.created_at);
      const monthKey = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      const total = parseFloat(String(order.total || 0));

      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { sales: 0, orders: 0 });
      }

      const data = monthlyData.get(monthKey)!;
      data.sales += total;
      data.orders += 1;
    });

    // Convert to array and sort by date
    const result = Array.from(monthlyData.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => {
        const dateA = new Date(a.month);
        const dateB = new Date(b.month);
        return dateA.getTime() - dateB.getTime();
      });

    return result;
  } catch (error) {
    console.error("Unexpected error in getSalesAndOrdersByMonth:", error);
    return [];
  }
}

/**
 * Get user growth data grouped by month for the last 6 months
 */
export async function getUserGrowthByMonth(): Promise<
  Array<{ month: string; users: number }>
> {
  try {
    const supabase = createSupabaseAdminClient();

    // Get profiles from the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("created_at")
      .gte("created_at", sixMonthsAgo.toISOString())
      .eq("is_active", true);

    if (error) {
      console.error("Error fetching user growth data:", error);
      return [];
    }

    // Group by month
    const monthlyData = new Map<string, number>();

    (profiles || []).forEach((profile) => {
      const date = new Date(profile.created_at);
      const monthKey = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });

      monthlyData.set(monthKey, (monthlyData.get(monthKey) || 0) + 1);
    });

    // Convert to array and sort by date
    const result = Array.from(monthlyData.entries())
      .map(([month, users]) => ({ month, users }))
      .sort((a, b) => {
        const dateA = new Date(a.month);
        const dateB = new Date(b.month);
        return dateA.getTime() - dateB.getTime();
      });

    return result;
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

export async function getAnalyticsStats(): Promise<AnalyticsStats> {
  try {
    const supabase = createSupabaseAdminClient();

    // Get all stats in parallel
    const [
      { count: userCount },
      { count: productCount },
      { data: orders },
      { count: cartsCount },
      { data: reviews },
      { data: contactUs },
      { data: products },
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true),
      supabase
        .from("products")
        .select("*", { count: "exact", head: true }),
      supabase
        .from("orders")
        .select("total"),
      supabase
        .from("carts")
        .select("id, cart_items!inner(id)", { count: "exact", head: true }),
      supabase
        .from("reviews")
        .select("id")
        .eq("review_status", "pending"),
      supabase
        .from("contact_us")
        .select("id")
        .in("status", ["new", "read"]),
      supabase
        .from("products")
        .select("id")
        .eq("is_active", true),
    ]);

    // Calculate revenue
    const totalRevenue =
      (orders || []).reduce((sum, order) => {
        return sum + parseFloat(String(order.total || 0));
      }, 0) || 0;

    // Calculate average order value
    const orderCount = (orders || []).length;
    const averageOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;

    // Get low stock products (products with variants that have stock <= 5)
    const { data: variants } = await supabase
      .from("customised_products")
      .select("product_id, quantity_stock")
      .lte("quantity_stock", 5);

    const lowStockProductIds = new Set(
      (variants || []).map((v) => v.product_id).filter(Boolean)
    );

    // products fetched for potential future use; keep query for parity with prior stats load
    void products;

    return {
      totalUsers: userCount || 0,
      totalProducts: productCount || 0,
      totalOrders: orderCount,
      totalRevenue,
      activeCarts: cartsCount || 0,
      pendingReviews: (reviews || []).length,
      pendingContactUs: (contactUs || []).length,
      lowStockProducts: lowStockProductIds.size,
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
 * Get top products by revenue
 */
export async function getTopProductsByRevenue(limit: number = 10): Promise<
  Array<{ product_id: string; product_name: string; revenue: number; orders: number }>
> {
  try {
    const supabase = createSupabaseAdminClient();

    // Get order items with product names
    const { data: orderItems, error } = await supabase
      .from("order_items")
      .select("product_name_snapshot, price_snapshot, quantity, order_id");

    if (error) {
      console.error("Error fetching top products:", error);
      return [];
    }

    // Get order IDs for valid orders
    const orderIds = [...new Set((orderItems || []).map((item) => item.order_id))];
    const { data: orders } = await supabase
      .from("orders")
      .select("id")
      .in("id", orderIds);

    const validOrderIds = new Set((orders || []).map((o) => o.id));

    // Calculate revenue per product
    const productRevenue = new Map<
      string,
      { product_name: string; revenue: number; orders: Set<string> }
    >();

    (orderItems || []).forEach((item) => {
      if (!validOrderIds.has(item.order_id)) return;

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

    // Convert to array, sort by revenue, and limit
    return Array.from(productRevenue.entries())
      .map(([product_name, data]) => ({
        product_id: product_name, // Using name as ID for now
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
