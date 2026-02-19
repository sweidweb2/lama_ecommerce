import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  totalOrdersThisMonth: number;
  revenueThisMonth: number;
  pendingOrders: number;
  lowStockItems: number;
  unansweredQA: number;
  pendingReviews: number;
}

export interface RecentOrder {
  id: string;
  total: number;
  status: string;
  payment_status: string;
  created_at: string;
  userName: string;
}

export interface RecentUser {
  user_id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
}

/**
 * Get dashboard statistics
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const supabase = createSupabaseAdminClient();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Fetch all data in parallel
    const [
      { count: totalUsers },
      { count: totalProducts },
      { data: ordersThisMonth },
      { data: allOrders },
      { data: lowStockVariants },
      { data: questions },
      { data: reviews },
    ] = await Promise.all([
      // Total active users
      (supabase as any)
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .is("deleted_at", null),
      
      // Total active products
      (supabase as any)
        .from("products")
        .select("*", { count: "exact", head: true })
        .is("deleted_at", null)
        .eq("is_active", true),
      
      // Orders this month
      (supabase as any)
        .from("orders")
        .select("total, created_at")
        .gte("created_at", startOfMonth.toISOString())
        .is("deleted_at", null),
      
      // All orders for pending count
      (supabase as any)
        .from("orders")
        .select("status")
        .is("deleted_at", null),
      
      // Low stock items (quantity <= 10 and > 0)
      (supabase as any)
        .from("customised_products")
        .select("quantity_stock")
        .is("deleted_at", null)
        .gt("quantity_stock", 0)
        .lte("quantity_stock", 10),
      
      // All questions for unanswered count
      (supabase as any)
        .from("product_questions")
        .select("answer")
        .is("deleted_at", null),
      
      // All reviews for pending count
      (supabase as any)
        .from("reviews")
        .select("review_status")
        .is("deleted_at", null),
    ]);

    // Calculate revenue this month
    const revenueThisMonth = (ordersThisMonth || []).reduce(
      (sum: number, order: any) => sum + parseFloat(order.total || 0),
      0
    );

    // Count pending orders
    const pendingOrders = (allOrders || []).filter(
      (order: any) => order.status === "pending"
    ).length;

    // Count unanswered Q&A
    const unansweredQA = (questions || []).filter(
      (q: any) => !q.answer || q.answer.trim() === ""
    ).length;

    // Count pending reviews
    const pendingReviews = (reviews || []).filter(
      (r: any) => r.review_status === "pending"
    ).length;

    return {
      totalUsers: totalUsers || 0,
      totalProducts: totalProducts || 0,
      totalOrdersThisMonth: ordersThisMonth?.length || 0,
      revenueThisMonth: Math.round(revenueThisMonth * 100) / 100,
      pendingOrders,
      lowStockItems: lowStockVariants?.length || 0,
      unansweredQA,
      pendingReviews,
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return {
      totalUsers: 0,
      totalProducts: 0,
      totalOrdersThisMonth: 0,
      revenueThisMonth: 0,
      pendingOrders: 0,
      lowStockItems: 0,
      unansweredQA: 0,
      pendingReviews: 0,
    };
  }
}

/**
 * Get recent orders (last 5)
 */
export async function getRecentOrders(limit: number = 5): Promise<RecentOrder[]> {
  try {
    const supabase = createSupabaseAdminClient();

    const { data: orders, error } = await (supabase as any)
      .from("orders")
      .select(`
        id,
        user_id,
        total,
        status,
        payment_status,
        created_at
      `)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !orders) {
      console.error("Error fetching recent orders:", error);
      return [];
    }

    // Get user names
    const userIds = [...new Set(orders.map((o: any) => o.user_id).filter(Boolean))];
    const { data: profiles } = userIds.length
      ? await (supabase as any)
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", userIds)
      : { data: [] };

    const profileMap = new Map<string, string>();
    (profiles || []).forEach((p: { user_id: string; full_name: string | null }) => {
      profileMap.set(p.user_id, p.full_name || "Unknown");
    });

    return orders.map((order: any) => ({
      id: order.id,
      total: parseFloat(order.total || 0),
      status: order.status,
      payment_status: order.payment_status,
      created_at: order.created_at,
      userName: order.user_id ? profileMap.get(order.user_id) || "Unknown" : "Guest",
    }));
  } catch (error) {
    console.error("Error fetching recent orders:", error);
    return [];
  }
}

/**
 * Get recent users (last 5)
 */
export async function getRecentUsers(limit: number = 5): Promise<RecentUser[]> {
  try {
    const supabase = createSupabaseAdminClient();

    // Try to use RPC function first to get emails
    const { data: profilesWithEmail, error: rpcError } = await (supabase as any)
      .rpc("get_admin_profiles");

    if (!rpcError && profilesWithEmail) {
      // Sort by created_at and take the most recent
      const sorted = (profilesWithEmail as any[])
        .filter((p: any) => !p.deleted_at)
        .sort((a: any, b: any) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        .slice(0, limit);

      return sorted.map((profile: any) => ({
        user_id: profile.user_id,
        full_name: profile.full_name,
        email: profile.email || null,
        created_at: profile.created_at,
      }));
    }

    // Fallback: fetch profiles without email
    const { data: profiles, error } = await (supabase as any)
      .from("profiles")
      .select(`
        user_id,
        full_name,
        created_at
      `)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !profiles) {
      console.error("Error fetching recent users:", error);
      return [];
    }

    return profiles.map((profile: any) => ({
      user_id: profile.user_id,
      full_name: profile.full_name,
      email: null,
      created_at: profile.created_at,
    }));
  } catch (error) {
    console.error("Error fetching recent users:", error);
    return [];
  }
}
