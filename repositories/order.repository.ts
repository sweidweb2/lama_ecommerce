import {
  createSupabaseServerComponentClient,
  createSupabaseServerActionClient,
} from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { scopeQueryToGuestSession } from "@/lib/repositories/storefront-owner-query";
import { fetchProfileNameMap } from "@/lib/repositories/profile-name-map";
import type { Order, OrderItem, Payment, Shipment, AddressSnapshot } from "@/types/order";
import type { Database } from "@/types/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  type OrderStatusConstant,
  type PaymentStatusConstant,
} from "@/lib/constants/order-status";

type OrderClient = SupabaseClient<Database>;

/**
 * Where a shared order read gets its Supabase client from.
 * The client is resolved lazily inside each shared function's try/catch so
 * client-creation failures keep the same error handling as before.
 * `scope` only selects log labels ("(admin)" / "ForAdmin"); it does not change queries.
 */
interface OrderClientSource {
  scope: "user" | "admin";
  getClient: () => OrderClient | Promise<OrderClient>;
}

const orderUserSource: OrderClientSource = {
  scope: "user",
  getClient: createSupabaseServerComponentClient,
};

const orderAdminSource: OrderClientSource = {
  scope: "admin",
  getClient: createSupabaseAdminClient,
};

function orderLogSuffix(source: OrderClientSource): string {
  return source.scope === "admin" ? " (admin)" : "";
}

function orderFnName(source: OrderClientSource, name: string): string {
  return source.scope === "admin" ? `${name}ForAdmin` : name;
}

/**
 * Admin-facing order row with denormalised user name.
 * Mirrors the `orders` table plus an optional `userName` derived from `profiles.full_name`.
 */
export interface AdminOrderRow extends Order {
  userName?: string;
}

/**
 * Get orders for a specific user (newest first).
 */
export async function getOrdersByUserId(
  userId: string,
  limit?: number,
): Promise<Order[]> {
  try {
    const supabase = await createSupabaseServerComponentClient();
    let query = supabase
      .from("orders")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching user orders:", error);
      return [];
    }

    return (data ?? []) as Order[];
  } catch (error) {
    console.error("Unexpected error in getOrdersByUserId:", error);
    return [];
  }
}

/**
 * Get order count for a specific user.
 */
export async function getOrderCountByUserId(userId: string): Promise<number> {
  try {
    const supabase = await createSupabaseServerComponentClient();
    const { count, error } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching user order count:", error);
      return 0;
    }

    return count ?? 0;
  } catch (error) {
    console.error("Unexpected error in getOrderCountByUserId:", error);
    return 0;
  }
}

async function getOrderByIdWithClient(
  source: OrderClientSource,
  orderId: string,
): Promise<Order | null> {
  try {
    const supabase = await source.getClient();
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .maybeSingle();

    if (error) {
      if (source.scope === "admin") {
        console.error("Error fetching order by id (admin):", error);
      } else {
        console.error("Error fetching order by id:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
      }
      return null;
    }

    return (data as Order) ?? null;
  } catch (error) {
    console.error(`Unexpected error in ${orderFnName(source, "getOrderById")}:`, error);
    return null;
  }
}

/**
 * Get a single order by ID.
 * Uses RLS — caller must own the order (user_id = auth.uid() or user_id IS NULL for guests).
 */
export async function getOrderById(
  orderId: string,
): Promise<Order | null> {
  return getOrderByIdWithClient(orderUserSource, orderId);
}

/**
 * Get a single order by ID - Admin use.
 * Uses admin client to bypass RLS.
 */
export async function getOrderByIdForAdmin(
  orderId: string,
): Promise<Order | null> {
  return getOrderByIdWithClient(orderAdminSource, orderId);
}

/**
 * Find a single order by checkout email + first-8 order id prefix (confirmation subject).
 * Returns null when zero or multiple matches (fail closed).
 */
export async function findOrderByEmailAndShortId(
  email: string,
  shortOrderId: string,
): Promise<Order | null> {
  try {
    const supabase = createSupabaseAdminClient();
    const normalizedEmail = email.trim().toLowerCase();
    const prefix = shortOrderId.trim().toLowerCase();

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .ilike("email", normalizedEmail)
      .limit(50);

    if (error) {
      console.error("Error finding order by email and short id:", error);
      return null;
    }

    const matches = ((data ?? []) as Order[]).filter((order) =>
      order.id.toLowerCase().startsWith(prefix),
    );

    if (matches.length !== 1) return null;
    return matches[0] ?? null;
  } catch (error) {
    console.error("Unexpected error in findOrderByEmailAndShortId:", error);
    return null;
  }
}

async function getOrderItemsByOrderIdWithClient(
  source: OrderClientSource,
  orderId: string,
): Promise<OrderItem[]> {
  try {
    const supabase = await source.getClient();
    const { data, error } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error(`Error fetching order items${orderLogSuffix(source)}:`, error);
      return [];
    }

    return (data ?? []) as OrderItem[];
  } catch (error) {
    console.error(
      `Unexpected error in ${orderFnName(source, "getOrderItemsByOrderId")}:`,
      error,
    );
    return [];
  }
}

/**
 * Get order items for a given order.
 * Uses RLS — only items belonging to the caller's orders are returned.
 */
export async function getOrderItemsByOrderId(
  orderId: string,
): Promise<OrderItem[]> {
  return getOrderItemsByOrderIdWithClient(orderUserSource, orderId);
}

/**
 * Get order items for a given order - Admin use.
 * Uses admin client to bypass RLS.
 */
export async function getOrderItemsByOrderIdForAdmin(
  orderId: string,
): Promise<OrderItem[]> {
  return getOrderItemsByOrderIdWithClient(orderAdminSource, orderId);
}

async function getPaymentByOrderIdWithClient(
  source: OrderClientSource,
  orderId: string,
): Promise<Payment | null> {
  try {
    const supabase = await source.getClient();
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error(`Error fetching payment${orderLogSuffix(source)}:`, error);
      return null;
    }

    return (data as Payment) ?? null;
  } catch (error) {
    console.error(
      `Unexpected error in ${orderFnName(source, "getPaymentByOrderId")}:`,
      error,
    );
    return null;
  }
}

/**
 * Get the payment record for an order (authenticated owner path).
 * Uses session client + RLS ("Users can read own payments").
 * Guest cookie / signed-token paths use getPaymentByOrderIdForAdmin.
 */
export async function getPaymentByOrderId(
  orderId: string,
): Promise<Payment | null> {
  return getPaymentByOrderIdWithClient(orderUserSource, orderId);
}

/**
 * Get the payment record for an order - Admin use.
 * Uses admin client to bypass RLS.
 */
export async function getPaymentByOrderIdForAdmin(
  orderId: string,
): Promise<Payment | null> {
  return getPaymentByOrderIdWithClient(orderAdminSource, orderId);
}

async function getShipmentByOrderIdWithClient(
  source: OrderClientSource,
  orderId: string,
): Promise<Shipment | null> {
  try {
    const supabase = await source.getClient();
    const { data, error } = await supabase
      .from("shipments")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error(`Error fetching shipment${orderLogSuffix(source)}:`, error);
      return null;
    }

    return (data as Shipment) ?? null;
  } catch (error) {
    console.error(
      `Unexpected error in ${orderFnName(source, "getShipmentByOrderId")}:`,
      error,
    );
    return null;
  }
}

/**
 * Get the shipment record for an order (authenticated owner path).
 * Uses session client + RLS ("Users can read own shipments").
 * Guest cookie / signed-token paths use getShipmentByOrderIdForAdmin.
 */
export async function getShipmentByOrderId(
  orderId: string,
): Promise<Shipment | null> {
  return getShipmentByOrderIdWithClient(orderUserSource, orderId);
}

/**
 * Get the shipment record for an order - Admin use.
 * Uses admin client to bypass RLS.
 */
export async function getShipmentByOrderIdForAdmin(
  orderId: string,
): Promise<Shipment | null> {
  return getShipmentByOrderIdWithClient(orderAdminSource, orderId);
}

const FULFILLMENT_ORDER_STATUSES = [
  "processing",
  "packed",
  "shipped",
] as const;

export type ListOrdersForAdminParams = {
  page?: number;
  pageSize?: number;
  status?: string;
  paymentStatus?: string;
};

export type ListOrdersForAdminResult = {
  items: AdminOrderRow[];
  total: number;
  page: number;
  pageSize: number;
};

const ORDER_ADMIN_SELECT = `
  id,
  user_id,
  session_id,
  status,
  subtotal,
  shipping_fee,
  discount,
  total,
  payment_status,
  address_snapshot,
  phone,
  email,
  shipping_zone_id,
  shipping_zone_name,
  created_at,
  updated_at
`;

/**
 * Paginated admin orders with optional status / payment filters.
 */
export async function listOrdersForAdmin(
  params: ListOrdersForAdminParams = {},
): Promise<ListOrdersForAdminResult> {
  const pageSize = Math.min(Math.max(params.pageSize ?? 20, 1), 100);
  let page = Math.max(params.page ?? 1, 1);
  const empty: ListOrdersForAdminResult = {
    items: [],
    total: 0,
    page: 1,
    pageSize,
  };

  try {
    const supabase = createSupabaseAdminClient();

    const buildQuery = () => {
      let query = supabase
        .from("orders")
        .select(ORDER_ADMIN_SELECT, { count: "exact" })
        .order("created_at", { ascending: false });

      const status = params.status?.trim();
      if (status && status !== "all") {
        if (status === "fulfillment") {
          query = query.in("status", [...FULFILLMENT_ORDER_STATUSES]);
        } else if ((ORDER_STATUSES as readonly string[]).includes(status)) {
          query = query.eq("status", status as OrderStatusConstant);
        }
      }

      const paymentStatus = params.paymentStatus?.trim();
      if (
        paymentStatus &&
        paymentStatus !== "all" &&
        (PAYMENT_STATUSES as readonly string[]).includes(paymentStatus)
      ) {
        query = query.eq(
          "payment_status",
          paymentStatus as PaymentStatusConstant,
        );
      }

      return query;
    };

    let from = (page - 1) * pageSize;
    let to = from + pageSize - 1;
    let { data: orders, error, count } = await buildQuery().range(from, to);

    if (error) {
      console.error("Error fetching orders for admin:", error);
      return empty;
    }

    const total = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    if (page > totalPages && total > 0) {
      page = totalPages;
      from = (page - 1) * pageSize;
      to = from + pageSize - 1;
      ({ data: orders, error, count } = await buildQuery().range(from, to));
      if (error) {
        console.error("Error fetching orders for admin:", error);
        return empty;
      }
    }

    if (!orders || orders.length === 0) {
      return { items: [], total, page, pageSize };
    }

    const profileMap = await fetchProfileNameMap(
      supabase,
      orders.map((o) => o.user_id),
    );

    return {
      items: orders.map((o) => ({
        ...(o as Order),
        userName: o.user_id
          ? profileMap.get(o.user_id) ?? "Unknown"
          : "Guest",
      })),
      total: count ?? total,
      page,
      pageSize,
    };
  } catch (error) {
    console.error("Unexpected error in listOrdersForAdmin:", error);
    return empty;
  }
}

/**
 * @deprecated Prefer listOrdersForAdmin for paginated admin UI.
 * Kept for tests/callers that expect a flat array (first page, max 100).
 */
export async function getAllOrdersForAdmin(): Promise<AdminOrderRow[]> {
  const result = await listOrdersForAdmin({ page: 1, pageSize: 100 });
  return result.items;
}

/**
 * Get orders for a guest session (newest first).
 * Uses service-role client; always filters by session_id + user_id IS NULL.
 */
export async function getOrdersBySessionId(
  sessionId: string,
  limit?: number,
): Promise<Order[]> {
  try {
    const supabase = createSupabaseAdminClient();
    let query = scopeQueryToGuestSession(
      supabase.from("orders").select("*"),
      sessionId,
    ).order("created_at", { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching session orders:", error);
      return [];
    }

    return (data ?? []) as Order[];
  } catch (error) {
    console.error("Unexpected error in getOrdersBySessionId:", error);
    return [];
  }
}

/**
 * Claim guest orders for a session onto a user account.
 * Uses service-role client (RLS only allows user_id = auth.uid() updates).
 * Only claims rows whose checkout email matches userEmail (case-insensitive),
 * reducing shared-device wrongful attribution.
 * Idempotent: already-claimed rows (user_id set) are skipped.
 * Leaves session_id intact for audit.
 * Empty/missing email → success with claimedCount 0 (no claim).
 */
export async function claimOrdersBySessionId(
  sessionId: string,
  userId: string,
  userEmail: string,
): Promise<{ success: boolean; error?: string; claimedCount: number }> {
  try {
    const normalizedEmail = userEmail.trim().toLowerCase();
    if (!normalizedEmail) {
      return { success: true, claimedCount: 0 };
    }

    const supabase = createSupabaseAdminClient();
    const { data, error } = await scopeQueryToGuestSession(
      supabase.from("orders").update({ user_id: userId }),
      sessionId,
    )
      .ilike("email", normalizedEmail)
      .select("id");

    if (error) {
      console.error("Error claiming guest orders:", error);
      return {
        success: false,
        error: error.message || "Failed to claim guest orders",
        claimedCount: 0,
      };
    }

    return {
      success: true,
      claimedCount: data?.length ?? 0,
    };
  } catch (error) {
    console.error("Unexpected error in claimOrdersBySessionId:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to claim guest orders",
      claimedCount: 0,
    };
  }
}

/**
 * Input for the process_checkout RPC function.
 * Shipping fee is resolved inside SQL from shipping_zone_id; discount is forced to 0.
 */
export interface ProcessCheckoutInput {
  cart_id: string;
  user_id: string | null;
  session_id: string | null;
  shipping_zone_id: string;
  phone: string;
  email: string;
  address_snapshot: AddressSnapshot;
  /** Optional; validated and applied inside process_checkout. */
  promo_code?: string | null;
}

/**
 * Execute the atomic checkout PG function via Supabase RPC.
 * Uses service-role client (EXECUTE revoked from anon/authenticated).
 * Ownership is enforced inside process_checkout (user_id or session_id match).
 * Shipping fee is resolved from p_shipping_zone_id inside the RPC.
 *
 * Returns the new order ID on success.
 */
export async function processCheckout(
  input: ProcessCheckoutInput,
): Promise<{ success: boolean; error?: string; orderId?: string }> {
  try {
    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase.rpc("process_checkout", {
      p_cart_id: input.cart_id,
      p_user_id: input.user_id,
      p_session_id: input.session_id,
      p_shipping_zone_id: input.shipping_zone_id,
      p_phone: input.phone,
      p_email: input.email,
      p_address_snapshot: input.address_snapshot as unknown as import("@/types/supabase").JSON,
      p_promo_code: input.promo_code?.trim() || null,
    });

    if (error) {
      console.error("Error in process_checkout RPC:", error);

      // Parse user-friendly messages from the PG function
      let errorMessage = error.message || "Checkout failed";
      if (errorMessage.includes("Cart not found")) {
        errorMessage = "Your cart was not found or has already been processed.";
      } else if (errorMessage.includes("Cart is empty")) {
        errorMessage = "Your cart is empty. Please add items before checking out.";
      } else if (errorMessage.includes("Insufficient stock")) {
        // e.g. 'Insufficient stock for "Product": requested 5, available 2'
        errorMessage = errorMessage.replace(/^.*Insufficient stock/, "Insufficient stock");
      } else if (errorMessage.includes("Stock race condition")) {
        errorMessage =
          "Some items went out of stock while you were checking out. Please review your cart.";
      } else if (errorMessage.includes("does not belong")) {
        errorMessage = "This cart does not belong to your account.";
      } else if (errorMessage.includes("Invalid promo code")) {
        errorMessage = "That promo code is not valid.";
      } else if (errorMessage.includes("Promo code is inactive")) {
        errorMessage = "That promo code is inactive.";
      } else if (errorMessage.includes("Promo code has expired")) {
        errorMessage = "That promo code has expired.";
      } else if (errorMessage.includes("usage limit")) {
        errorMessage = "That promo code has reached its usage limit.";
      } else if (errorMessage.includes("Invalid shipping zone")) {
        errorMessage = "Invalid shipping zone selected.";
      }

      return { success: false, error: errorMessage };
    }

    return { success: true, orderId: data as string };
  } catch (error) {
    console.error("Unexpected error in processCheckout:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unexpected error during checkout",
    };
  }
}

export interface UpsertPaymentForOrderInput {
  order_id: string;
  status: Payment["status"];
  amount?: number | null;
  currency?: string | null;
  transaction_id?: string | null;
  paid_at?: string | null;
  gateway?: string | null;
  payment_method?: string | null;
  payment_url?: string | null;
}

/**
 * Insert or update the payment for an order and sync orders.payment_status
 * in one DB transaction (upsert_payment_for_order RPC).
 */
export async function upsertPaymentForOrder(
  input: UpsertPaymentForOrderInput,
): Promise<{ success: boolean; error?: string; data?: Payment }> {
  try {
    const supabase = createSupabaseAdminClient();

    const paidAt =
      input.paid_at !== undefined
        ? input.paid_at
        : input.status === "paid"
          ? new Date().toISOString()
          : null;

    const { data, error } = await supabase.rpc("upsert_payment_for_order", {
      p_order_id: input.order_id,
      p_status: input.status,
      p_amount: input.amount !== undefined ? input.amount : null,
      p_currency: input.currency?.trim() || "USD",
      p_transaction_id: input.transaction_id?.trim() || null,
      p_paid_at: paidAt,
      p_gateway: input.gateway?.trim() || null,
      p_payment_method: input.payment_method?.trim() || null,
      p_payment_url: input.payment_url?.trim() || null,
    });

    if (error) {
      console.error("Error in upsert_payment_for_order RPC:", error);
      return {
        success: false,
        error: error.message || "Failed to save payment",
      };
    }

    return { success: true, data: data as Payment };
  } catch (error) {
    console.error("Unexpected error in upsertPaymentForOrder:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unexpected error occurred",
    };
  }
}

export interface UpdateOrderInput {
  user_id?: string | null;
  status?: Order["status"];
  payment_status?: Order["payment_status"];
  subtotal?: number | null;
  shipping_fee?: number | null;
  discount?: number | null;
  total?: number | null;
  phone?: string | null;
  email?: string | null;
  /** Required when transitioning to shipped and no shipment exists yet. */
  carrier_name?: string;
  tracking_number?: string;
}

/**
 * Update an order by ID (admin use) via admin_update_order RPC.
 * Atomically syncs payment row and creates shipment when marking shipped.
 */
export async function updateOrder(
  orderId: string,
  input: UpdateOrderInput,
): Promise<{ success: boolean; error?: string; data?: Order }> {
  try {
    const supabase = createSupabaseAdminClient();

    const patch: Record<string, unknown> = {};
    if (input.user_id !== undefined) patch.user_id = input.user_id;
    if (input.status !== undefined) patch.status = input.status;
    if (input.payment_status !== undefined) {
      patch.payment_status = input.payment_status;
    }
    if (input.subtotal !== undefined) patch.subtotal = input.subtotal;
    if (input.shipping_fee !== undefined) patch.shipping_fee = input.shipping_fee;
    if (input.discount !== undefined) patch.discount = input.discount;
    if (input.total !== undefined) patch.total = input.total;
    if (input.phone !== undefined) patch.phone = input.phone?.trim() || null;
    if (input.email !== undefined) patch.email = input.email?.trim() || null;

    if (Object.keys(patch).length === 0) {
      return {
        success: false,
        error: "No fields to update",
      };
    }

    const { data, error } = await supabase.rpc("admin_update_order", {
      p_order_id: orderId,
      p_patch: patch as unknown as import("@/types/supabase").JSON,
      p_carrier_name: input.carrier_name?.trim() || null,
      p_tracking_number: input.tracking_number?.trim() || null,
    });

    if (error) {
      console.error("Error in admin_update_order RPC:", error);
      let errorMessage = error.message || "Failed to update order";
      if (errorMessage.includes("Carrier and tracking")) {
        errorMessage =
          "Carrier and tracking number are required to mark as shipped";
      } else if (errorMessage.includes("Order not found")) {
        errorMessage = "Order not found";
      }
      return { success: false, error: errorMessage };
    }

    return {
      success: true,
      data: data as Order,
    };
  } catch (error) {
    console.error("Unexpected error in updateOrder:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unexpected error occurred",
    };
  }
}

/**
 * Count payments for an order (admin).
 * Fail closed: never return a fake 0 on query error.
 */
export async function countPaymentsByOrderId(
  orderId: string,
): Promise<{ success: true; count: number } | { success: false; error: string }> {
  try {
    const supabase = createSupabaseAdminClient();
    const { count, error } = await supabase
      .from("payments")
      .select("*", { count: "exact", head: true })
      .eq("order_id", orderId);

    if (error) {
      console.error("Error counting payments:", error);
      return {
        success: false,
        error: error.message || "Failed to count payments",
      };
    }
    return { success: true, count: count ?? 0 };
  } catch (error) {
    console.error("Unexpected error in countPaymentsByOrderId:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unexpected error counting payments",
    };
  }
}

/**
 * Count shipments for an order (admin). Used when deciding whether to create a shipment.
 * Fail closed: never return a fake 0 on query error.
 */
export async function countShipmentsByOrderId(
  orderId: string,
): Promise<{ success: true; count: number } | { success: false; error: string }> {
  try {
    const supabase = createSupabaseAdminClient();
    const { count, error } = await supabase
      .from("shipments")
      .select("*", { count: "exact", head: true })
      .eq("order_id", orderId);

    if (error) {
      console.error("Error counting shipments:", error);
      return {
        success: false,
        error: error.message || "Failed to count shipments",
      };
    }
    return { success: true, count: count ?? 0 };
  } catch (error) {
    console.error("Unexpected error in countShipmentsByOrderId:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unexpected error counting shipments",
    };
  }
}

/**
 * Hard-delete an order using admin client (bypass RLS).
 * Order items, payments, and shipments are removed via ON DELETE CASCADE.
 * Caller should cancel first when stock_restored is false so inventory is restored.
 */
export async function deleteOrderAdmin(
  orderId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createSupabaseAdminClient();

    if (!orderId || typeof orderId !== "string") {
      return {
        success: false,
        error: "Invalid order ID",
      };
    }

    const { data: existingOrder, error: checkError } = await supabase
      .from("orders")
      .select("id")
      .eq("id", orderId)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking order existence:", checkError);
      return {
        success: false,
        error: "Failed to verify order existence",
      };
    }

    if (!existingOrder) {
      return {
        success: false,
        error: "Order not found",
      };
    }

    const { error } = await supabase
      .from("orders")
      .delete()
      .eq("id", orderId);

    if (error) {
      console.error("Error deleting order:", error);
      return {
        success: false,
        error: error.message || "Failed to delete order",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error in deleteOrderAdmin:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unexpected error occurred",
    };
  }
}