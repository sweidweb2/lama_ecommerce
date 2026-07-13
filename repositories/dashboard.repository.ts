import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  totalOrdersThisMonth: number;
  revenueThisMonth: number;
  pendingOrders: number;
  processingOrders: number;
  lowStockItems: number;
  outOfStockItems: number;
  unansweredQA: number;
  pendingReviews: number;
  newContacts: number;
  activeCarts: number;
  newLeadsThisMonth: number;
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

export interface LowStockItem {
  id: string;
  sku_variant: string | null;
  quantity_stock: number;
  productName: string;
  productId: string;
}

export interface PendingReviewItem {
  id: string;
  rating: number;
  title: string | null;
  productName: string;
  created_at: string;
}

export interface UnansweredQuestionItem {
  id: string;
  question: string;
  productName: string;
  created_at: string;
}

export interface RecentContactItem {
  id: string;
  full_name: string | null;
  email: string | null;
  subject: string | null;
  status: string;
  created_at: string;
}

export interface TopProductItem {
  productName: string;
  unitsSold: number;
  revenue: number;
}

export interface OrderStatusBreakdown {
  status: string;
  count: number;
}

const EMPTY_STATS: DashboardStats = {
  totalUsers: 0,
  totalProducts: 0,
  totalOrdersThisMonth: 0,
  revenueThisMonth: 0,
  pendingOrders: 0,
  processingOrders: 0,
  lowStockItems: 0,
  outOfStockItems: 0,
  unansweredQA: 0,
  pendingReviews: 0,
  newContacts: 0,
  activeCarts: 0,
  newLeadsThisMonth: 0,
};

/**
 * Get dashboard statistics from live tables.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const supabase = createSupabaseAdminClient();
    const startOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1,
    ).toISOString();

    const [
      usersRes,
      productsRes,
      ordersMonthRes,
      ordersStatusRes,
      lowStockRes,
      outOfStockRes,
      questionsRes,
      answersRes,
      reviewsRes,
      contactsRes,
      cartsRes,
      leadsRes,
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true),
      supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true),
      supabase
        .from("orders")
        .select("total")
        .gte("created_at", startOfMonth),
      supabase.from("orders").select("status"),
      supabase
        .from("customised_products")
        .select("id", { count: "exact", head: true })
        .gt("quantity_stock", 0)
        .lte("quantity_stock", 10),
      supabase
        .from("customised_products")
        .select("id", { count: "exact", head: true })
        .eq("quantity_stock", 0),
      supabase.from("product_questions").select("id"),
      supabase.from("product_answers").select("product_question_id"),
      supabase
        .from("reviews")
        .select("id", { count: "exact", head: true })
        .eq("review_status", "pending"),
      supabase
        .from("contact_us")
        .select("id", { count: "exact", head: true })
        .eq("status", "new"),
      supabase.from("carts").select("id", { count: "exact", head: true }),
      supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .gte("created_at", startOfMonth),
    ]);

    const answeredIds = new Set(
      (answersRes.data || []).map(
        (a: { product_question_id: string }) => a.product_question_id,
      ),
    );
    const unansweredQA = (questionsRes.data || []).filter(
      (q: { id: string }) => !answeredIds.has(q.id),
    ).length;

    const revenueThisMonth = (ordersMonthRes.data || []).reduce(
      (sum: number, order: { total: number | null }) =>
        sum + Number(order.total || 0),
      0,
    );

    const statuses = ordersStatusRes.data || [];
    const pendingOrders = statuses.filter(
      (o: { status: string }) => o.status === "pending",
    ).length;
    const processingOrders = statuses.filter((o: { status: string }) =>
      ["processing", "packed", "shipped"].includes(o.status),
    ).length;

    return {
      totalUsers: usersRes.count || 0,
      totalProducts: productsRes.count || 0,
      totalOrdersThisMonth: ordersMonthRes.data?.length || 0,
      revenueThisMonth: Math.round(revenueThisMonth * 100) / 100,
      pendingOrders,
      processingOrders,
      lowStockItems: lowStockRes.count || 0,
      outOfStockItems: outOfStockRes.count || 0,
      unansweredQA,
      pendingReviews: reviewsRes.count || 0,
      newContacts: contactsRes.count || 0,
      activeCarts: cartsRes.count || 0,
      newLeadsThisMonth: leadsRes.count || 0,
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return { ...EMPTY_STATS };
  }
}

export async function getRecentOrders(limit: number = 5): Promise<RecentOrder[]> {
  try {
    const supabase = createSupabaseAdminClient();

    const { data: orders, error } = await supabase
      .from("orders")
      .select("id, user_id, total, status, payment_status, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !orders) {
      console.error("Error fetching recent orders:", error);
      return [];
    }

    const userIds = [
      ...new Set(
        orders.map((o) => o.user_id).filter((id): id is string => Boolean(id)),
      ),
    ];
    const { data: profiles } = userIds.length
      ? await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", userIds)
      : { data: [] };

    const profileMap = new Map(
      (profiles || []).map((p) => [p.user_id, p.full_name || "Unknown"]),
    );

    return orders.map((order) => ({
      id: order.id,
      total: Number(order.total || 0),
      status: order.status,
      payment_status: order.payment_status,
      created_at: order.created_at,
      userName: order.user_id
        ? profileMap.get(order.user_id) || "Unknown"
        : "Guest",
    }));
  } catch (error) {
    console.error("Error fetching recent orders:", error);
    return [];
  }
}

export async function getRecentUsers(limit: number = 5): Promise<RecentUser[]> {
  try {
    const supabase = createSupabaseAdminClient();

    const { data: profilesWithEmail, error: rpcError } = await supabase.rpc(
      "get_admin_profiles",
    );

    if (!rpcError && profilesWithEmail) {
      return (profilesWithEmail as Array<{
        user_id: string;
        full_name: string | null;
        email: string | null;
        created_at: string;
        is_active?: boolean;
      }>)
        .filter((p) => p.is_active !== false)
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )
        .slice(0, limit)
        .map((profile) => ({
          user_id: profile.user_id,
          full_name: profile.full_name,
          email: profile.email || null,
          created_at: profile.created_at,
        }));
    }

    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("user_id, full_name, created_at")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !profiles) {
      console.error("Error fetching recent users:", error);
      return [];
    }

    return profiles.map((profile) => ({
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

export async function getLowStockItems(
  limit: number = 8,
): Promise<LowStockItem[]> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("customised_products")
      .select(
        "id, sku_variant, quantity_stock, product_id, products(id, name)",
      )
      .gt("quantity_stock", 0)
      .lte("quantity_stock", 10)
      .order("quantity_stock", { ascending: true })
      .limit(limit);

    if (error || !data) {
      console.error("Error fetching low stock items:", error);
      return [];
    }

    return data.map((row) => {
      const product = row.products as
        | { id: string; name: string }
        | { id: string; name: string }[]
        | null;
      const productRow = Array.isArray(product) ? product[0] : product;
      return {
        id: row.id,
        sku_variant: row.sku_variant,
        quantity_stock: row.quantity_stock,
        productName: productRow?.name || "Unknown product",
        productId: productRow?.id || row.product_id,
      };
    });
  } catch (error) {
    console.error("Error fetching low stock items:", error);
    return [];
  }
}

export async function getPendingReviewsPreview(
  limit: number = 5,
): Promise<PendingReviewItem[]> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("reviews")
      .select("id, rating, title, created_at, product_id, products(name)")
      .eq("review_status", "pending")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !data) {
      console.error("Error fetching pending reviews:", error);
      return [];
    }

    return data.map((row) => {
      const product = row.products as
        | { name: string }
        | { name: string }[]
        | null;
      const productRow = Array.isArray(product) ? product[0] : product;
      return {
        id: row.id,
        rating: row.rating,
        title: row.title,
        productName: productRow?.name || "Unknown product",
        created_at: row.created_at,
      };
    });
  } catch (error) {
    console.error("Error fetching pending reviews:", error);
    return [];
  }
}

export async function getUnansweredQuestionsPreview(
  limit: number = 5,
): Promise<UnansweredQuestionItem[]> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data: questions, error } = await supabase
      .from("product_questions")
      .select(
        "id, question, created_at, product_id, products(name), product_answers(id)",
      )
      .order("created_at", { ascending: false })
      .limit(40);

    if (error || !questions) {
      console.error("Error fetching unanswered questions:", error);
      return [];
    }

    return questions
      .filter((q) => {
        const answers = q.product_answers as { id: string }[] | null;
        return !answers || answers.length === 0;
      })
      .slice(0, limit)
      .map((row) => {
        const product = row.products as
          | { name: string }
          | { name: string }[]
          | null;
        const productRow = Array.isArray(product) ? product[0] : product;
        return {
          id: row.id,
          question: row.question,
          productName: productRow?.name || "Unknown product",
          created_at: row.created_at,
        };
      });
  } catch (error) {
    console.error("Error fetching unanswered questions:", error);
    return [];
  }
}

export async function getRecentContacts(
  limit: number = 5,
): Promise<RecentContactItem[]> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("contact_us")
      .select("id, full_name, email, subject, status, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !data) {
      console.error("Error fetching recent contacts:", error);
      return [];
    }

    return data.map((row) => ({
      id: row.id,
      full_name: row.full_name,
      email: row.email,
      subject: row.subject,
      status: row.status,
      created_at: row.created_at,
    }));
  } catch (error) {
    console.error("Error fetching recent contacts:", error);
    return [];
  }
}

export async function getTopSellingProducts(
  limit: number = 5,
): Promise<TopProductItem[]> {
  try {
    const supabase = createSupabaseAdminClient();
    const startOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1,
    ).toISOString();

    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("id")
      .gte("created_at", startOfMonth)
      .neq("status", "cancelled");

    if (ordersError || !orders?.length) {
      return [];
    }

    const orderIds = orders.map((o) => o.id);
    const { data: items, error } = await supabase
      .from("order_items")
      .select("product_name_snapshot, quantity, price_snapshot")
      .in("order_id", orderIds);

    if (error || !items) {
      console.error("Error fetching top products:", error);
      return [];
    }

    const map = new Map<string, { unitsSold: number; revenue: number }>();
    for (const item of items) {
      const name = item.product_name_snapshot || "Unknown";
      const current = map.get(name) || { unitsSold: 0, revenue: 0 };
      const qty = Number(item.quantity || 0);
      const price = Number(item.price_snapshot || 0);
      current.unitsSold += qty;
      current.revenue += qty * price;
      map.set(name, current);
    }

    return [...map.entries()]
      .map(([productName, stats]) => ({
        productName,
        unitsSold: stats.unitsSold,
        revenue: Math.round(stats.revenue * 100) / 100,
      }))
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, limit);
  } catch (error) {
    console.error("Error fetching top selling products:", error);
    return [];
  }
}

export async function getOrderStatusBreakdown(): Promise<OrderStatusBreakdown[]> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.from("orders").select("status");
    if (error || !data) {
      console.error("Error fetching order status breakdown:", error);
      return [];
    }

    const counts = new Map<string, number>();
    for (const row of data) {
      counts.set(row.status, (counts.get(row.status) || 0) + 1);
    }

    return [...counts.entries()]
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count);
  } catch (error) {
    console.error("Error fetching order status breakdown:", error);
    return [];
  }
}
