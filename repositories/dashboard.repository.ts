import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AdminDateRange } from "@/lib/admin/date-range";
import { parseAdminDateRange } from "@/lib/admin/date-range";
import {
  LOW_STOCK_MAX,
  LOW_STOCK_MIN,
  REVENUE_EXCLUDED_STATUSES,
} from "@/lib/admin/metric-definitions";

export interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  totalOrdersThisMonth: number;
  revenueThisMonth: number;
  ordersLastMonth: number;
  revenueLastMonth: number;
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
  productId: string;
  created_at: string;
}

export interface UnansweredQuestionItem {
  id: string;
  question: string;
  productName: string;
  productId: string;
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
  productId: string;
  productName: string;
  unitsSold: number;
  revenue: number;
}

export interface OrderStatusBreakdown {
  status: string;
  count: number;
}

const ORDER_STATUSES = [
  "pending",
  "processing",
  "packed",
  "shipped",
  "delivered",
  "returned",
  "cancelled",
] as const;

type QueryResult = { error: { message: string } | null };

function assertNoQueryErrors(
  labeled: Array<{ label: string; result: QueryResult }>,
): void {
  const failed = labeled.filter(({ result }) => result.error);
  if (failed.length === 0) return;
  const detail = failed
    .map(({ label, result }) => `${label}: ${result.error!.message}`)
    .join("; ");
  throw new Error(`Dashboard query failed (${detail})`);
}

function sumFromAggregate(
  data: Array<{ sum: number | null } | { total: number | null }> | null,
): number {
  const row = data?.[0] ?? null;
  const rawSum =
    row && "sum" in row ? row.sum : row && "total" in row ? row.total : 0;
  return Math.round(Number(rawSum || 0) * 100) / 100;
}

type OrdersFilterBuilder = {
  gte: (column: string, value: string) => OrdersFilterBuilder;
  lt: (column: string, value: string) => OrdersFilterBuilder;
  neq: (column: string, value: string) => OrdersFilterBuilder;
};

function applyOrderRangeFilters<T extends OrdersFilterBuilder>(
  query: T,
  fromIso: string | null,
  toIsoExclusive: string | null,
): T {
  let next = query;
  if (fromIso) next = next.gte("created_at", fromIso) as T;
  if (toIsoExclusive) next = next.lt("created_at", toIsoExclusive) as T;
  for (const status of REVENUE_EXCLUDED_STATUSES) {
    next = next.neq("status", status) as T;
  }
  return next;
}

/**
 * Get dashboard statistics from live tables.
 * Order counts/sums use exact head counts / PostgREST aggregates (not row loads).
 */
export async function getDashboardStats(
  range: AdminDateRange = parseAdminDateRange(undefined, {
    defaultPreset: "this_month",
  }),
): Promise<DashboardStats> {
  const supabase = createSupabaseAdminClient();

  const rangeCountQuery = () =>
    applyOrderRangeFilters(
      supabase.from("orders").select("id", { count: "exact", head: true }),
      range.fromIso,
      range.toIsoExclusive,
    );
  const rangeRevenueQuery = () =>
    applyOrderRangeFilters(
      supabase.from("orders").select("total.sum()"),
      range.fromIso,
      range.toIsoExclusive,
    );
  const compareCountQuery = () =>
    applyOrderRangeFilters(
      supabase.from("orders").select("id", { count: "exact", head: true }),
      range.compareFromIso,
      range.compareToIsoExclusive,
    );
  const compareRevenueQuery = () =>
    applyOrderRangeFilters(
      supabase.from("orders").select("total.sum()"),
      range.compareFromIso,
      range.compareToIsoExclusive,
    );

  const leadsQuery = (() => {
    let q = supabase.from("leads").select("id", { count: "exact", head: true });
    if (range.fromIso) q = q.gte("created_at", range.fromIso);
    if (range.toIsoExclusive) q = q.lt("created_at", range.toIsoExclusive);
    return q;
  })();

  const [
    usersRes,
    productsRes,
    ordersMonthCountRes,
    ordersMonthRevenueRes,
    ordersLastMonthCountRes,
    ordersLastMonthRevenueRes,
    pendingOrdersRes,
    processingOrdersRes,
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
    rangeCountQuery(),
    rangeRevenueQuery(),
    compareCountQuery(),
    compareRevenueQuery(),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .in("status", ["processing", "packed"]),
    supabase
      .from("customised_products")
      .select("id", { count: "exact", head: true })
      .gte("quantity_stock", LOW_STOCK_MIN)
      .lte("quantity_stock", LOW_STOCK_MAX),
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
    leadsQuery,
  ]);

  assertNoQueryErrors([
    { label: "users", result: usersRes },
    { label: "products", result: productsRes },
    { label: "ordersMonthCount", result: ordersMonthCountRes },
    { label: "ordersMonthRevenue", result: ordersMonthRevenueRes },
    { label: "ordersLastMonthCount", result: ordersLastMonthCountRes },
    { label: "ordersLastMonthRevenue", result: ordersLastMonthRevenueRes },
    { label: "pendingOrders", result: pendingOrdersRes },
    { label: "processingOrders", result: processingOrdersRes },
    { label: "lowStock", result: lowStockRes },
    { label: "outOfStock", result: outOfStockRes },
    { label: "questions", result: questionsRes },
    { label: "answers", result: answersRes },
    { label: "reviews", result: reviewsRes },
    { label: "contacts", result: contactsRes },
    { label: "carts", result: cartsRes },
    { label: "leads", result: leadsRes },
  ]);

  const answeredIds = new Set(
    (answersRes.data || []).map(
      (a: { product_question_id: string }) => a.product_question_id,
    ),
  );
  const unansweredQA = (questionsRes.data || []).filter(
    (q: { id: string }) => !answeredIds.has(q.id),
  ).length;

  return {
    totalUsers: usersRes.count || 0,
    totalProducts: productsRes.count || 0,
    totalOrdersThisMonth: ordersMonthCountRes.count || 0,
    revenueThisMonth: sumFromAggregate(
      ordersMonthRevenueRes.data as
        | Array<{ sum: number | null } | { total: number | null }>
        | null,
    ),
    ordersLastMonth: ordersLastMonthCountRes.count || 0,
    revenueLastMonth: sumFromAggregate(
      ordersLastMonthRevenueRes.data as
        | Array<{ sum: number | null } | { total: number | null }>
        | null,
    ),
    pendingOrders: pendingOrdersRes.count || 0,
    processingOrders: processingOrdersRes.count || 0,
    lowStockItems: lowStockRes.count || 0,
    outOfStockItems: outOfStockRes.count || 0,
    unansweredQA,
    pendingReviews: reviewsRes.count || 0,
    newContacts: contactsRes.count || 0,
    activeCarts: cartsRes.count || 0,
    newLeadsThisMonth: leadsRes.count || 0,
  };
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
      return profilesWithEmail
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
      .gte("quantity_stock", LOW_STOCK_MIN)
      .lte("quantity_stock", LOW_STOCK_MAX)
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
        productId: row.product_id,
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

    const { data: answers, error: answersError } = await supabase
      .from("product_answers")
      .select("product_question_id");

    if (answersError) {
      console.error("Error fetching answers for unanswered preview:", answersError);
      return [];
    }

    const answeredIds = [
      ...new Set(
        (answers || []).map(
          (a: { product_question_id: string }) => a.product_question_id,
        ),
      ),
    ];

    let query = supabase
      .from("product_questions")
      .select("id, question, created_at, product_id, products(name)")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (answeredIds.length > 0) {
      query = query.not("id", "in", `(${answeredIds.join(",")})`);
    }

    const { data: questions, error } = await query;

    if (error || !questions) {
      console.error("Error fetching unanswered questions:", error);
      return [];
    }

    return questions.map((row) => {
      const product = row.products as
        | { name: string }
        | { name: string }[]
        | null;
      const productRow = Array.isArray(product) ? product[0] : product;
      return {
        id: row.id,
        question: row.question,
        productName: productRow?.name || "Unknown product",
        productId: row.product_id,
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
  range: AdminDateRange = parseAdminDateRange(undefined, {
    defaultPreset: "this_month",
  }),
): Promise<TopProductItem[]> {
  try {
    const supabase = createSupabaseAdminClient();

    let ordersQuery = supabase.from("orders").select("id");
    ordersQuery = applyOrderRangeFilters(
      ordersQuery,
      range.fromIso,
      range.toIsoExclusive,
    );

    const { data: orders, error: ordersError } = await ordersQuery;

    if (ordersError || !orders?.length) {
      return [];
    }

    const orderIds = orders.map((o) => o.id);
    const { data: items, error } = await supabase
      .from("order_items")
      .select(
        `
        product_name_snapshot,
        quantity,
        price_snapshot,
        customised_products (
          product_id,
          products ( id, name )
        )
      `,
      )
      .in("order_id", orderIds);

    if (error || !items) {
      console.error("Error fetching top products:", error);
      return [];
    }

    type NestedProduct = { id?: string; name?: string | null } | null;
    type NestedCp = {
      product_id?: string | null;
      products?: NestedProduct | NestedProduct[] | null;
    } | null;

    const unwrapOne = <T,>(value: T | T[] | null | undefined): T | null => {
      if (value == null) return null;
      return Array.isArray(value) ? (value[0] ?? null) : value;
    };

    const map = new Map<
      string,
      { productName: string; unitsSold: number; revenue: number }
    >();

    for (const item of items) {
      const cp = unwrapOne(
        (item as { customised_products?: NestedCp | NestedCp[] })
          .customised_products,
      );
      const product = unwrapOne(cp?.products ?? null);
      const snapshot =
        (item.product_name_snapshot as string | null)?.trim() || "";
      const liveName = product?.name?.trim() || "";
      const productName = liveName || snapshot || "Unknown";
      const productId =
        (typeof cp?.product_id === "string" && cp.product_id) ||
        (typeof product?.id === "string" && product.id) ||
        `orphan:${snapshot || "unknown"}`;

      const current = map.get(productId) || {
        productName,
        unitsSold: 0,
        revenue: 0,
      };
      const qty = Number(item.quantity || 0);
      const price = Number(item.price_snapshot || 0);
      current.unitsSold += qty;
      current.revenue += qty * price;
      if (liveName) current.productName = liveName;
      map.set(productId, current);
    }

    return [...map.entries()]
      .map(([productId, stats]) => ({
        productId,
        productName: stats.productName,
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
  const supabase = createSupabaseAdminClient();

  const results = await Promise.all(
    ORDER_STATUSES.map((status) =>
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("status", status)
        .then((result) => ({ status, result })),
    ),
  );

  assertNoQueryErrors(
    results.map(({ status, result }) => ({
      label: `status:${status}`,
      result,
    })),
  );

  return results
    .map(({ status, result }) => ({
      status,
      count: result.count || 0,
    }))
    .filter((row) => row.count > 0)
    .sort((a, b) => b.count - a.count);
}
