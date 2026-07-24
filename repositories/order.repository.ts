import {
  createSupabaseServerComponentClient,
  createSupabaseServerActionClient,
} from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Order, OrderItem, Payment, Shipment, AddressSnapshot } from "@/types/order";
import type { Database } from "@/types/supabase";

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

/**
 * Get a single order by ID.
 * Uses RLS — caller must own the order (user_id = auth.uid() or user_id IS NULL for guests).
 */
export async function getOrderById(
  orderId: string,
): Promise<Order | null> {
  try {
    const supabase = await createSupabaseServerComponentClient();
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching order by id:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return null;
    }

    return (data as Order) ?? null;
  } catch (error) {
    console.error("Unexpected error in getOrderById:", error);
    return null;
  }
}

/**
 * Get a single order by ID - Admin use.
 * Uses admin client to bypass RLS.
 */
export async function getOrderByIdForAdmin(
  orderId: string,
): Promise<Order | null> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching order by id (admin):", error);
      return null;
    }

    return (data as Order) ?? null;
  } catch (error) {
    console.error("Unexpected error in getOrderByIdForAdmin:", error);
    return null;
  }
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

/**
 * Get order items for a given order.
 * Uses RLS — only items belonging to the caller's orders are returned.
 */
export async function getOrderItemsByOrderId(
  orderId: string,
): Promise<OrderItem[]> {
  try {
    const supabase = await createSupabaseServerComponentClient();
    const { data, error } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching order items:", error);
      return [];
    }

    return (data ?? []) as OrderItem[];
  } catch (error) {
    console.error("Unexpected error in getOrderItemsByOrderId:", error);
    return [];
  }
}

/**
 * Get order items for a given order - Admin use.
 * Uses admin client to bypass RLS.
 */
export async function getOrderItemsByOrderIdForAdmin(
  orderId: string,
): Promise<OrderItem[]> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching order items (admin):", error);
      return [];
    }

    return (data ?? []) as OrderItem[];
  } catch (error) {
    console.error("Unexpected error in getOrderItemsByOrderIdForAdmin:", error);
    return [];
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
  try {
    const supabase = await createSupabaseServerComponentClient();
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error fetching payment:", error);
      return null;
    }

    return (data as Payment) ?? null;
  } catch (error) {
    console.error("Unexpected error in getPaymentByOrderId:", error);
    return null;
  }
}

/**
 * Get the payment record for an order - Admin use.
 * Uses admin client to bypass RLS.
 */
export async function getPaymentByOrderIdForAdmin(
  orderId: string,
): Promise<Payment | null> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error fetching payment (admin):", error);
      return null;
    }

    return (data as Payment) ?? null;
  } catch (error) {
    console.error("Unexpected error in getPaymentByOrderIdForAdmin:", error);
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
  try {
    const supabase = await createSupabaseServerComponentClient();
    const { data, error } = await supabase
      .from("shipments")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error fetching shipment:", error);
      return null;
    }

    return (data as Shipment) ?? null;
  } catch (error) {
    console.error("Unexpected error in getShipmentByOrderId:", error);
    return null;
  }
}

/**
 * Get the shipment record for an order - Admin use.
 * Uses admin client to bypass RLS.
 */
export async function getShipmentByOrderIdForAdmin(
  orderId: string,
): Promise<Shipment | null> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("shipments")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error fetching shipment (admin):", error);
      return null;
    }

    return (data as Shipment) ?? null;
  } catch (error) {
    console.error("Unexpected error in getShipmentByOrderIdForAdmin:", error);
    return null;
  }
}

/**
 * Get all orders for the admin panel with user information.
 * Uses the admin client to bypass RLS and join profiles for user names.
 */
export async function getAllOrdersForAdmin(): Promise<AdminOrderRow[]> {
  try {
    const supabase = createSupabaseAdminClient();

    // Fetch all orders
    const { data: orders, error } = await supabase
      .from("orders")
      .select(`
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
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching orders for admin:", error);
      return [];
    }

    if (!orders || orders.length === 0) {
      return [];
    }

    // Gather unique user IDs for name lookup
    const userIds = [
      ...new Set(
        orders
          .map((o) => o.user_id)
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    const { data: profiles } = userIds.length
      ? await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", userIds)
      : { data: [] };

    const profileMap = new Map<string, string>();
    (profiles ?? []).forEach(
      (p: { user_id: string; full_name: string | null }) => {
        profileMap.set(p.user_id, p.full_name || "Unknown");
      },
    );

    // Map raw orders into AdminOrderRow with userName
    return orders.map((o) => ({
      ...(o as Order),
      userName: o.user_id
        ? profileMap.get(o.user_id) ?? "Unknown"
        : "Guest",
    }));
  } catch (error) {
    console.error("Unexpected error in getAllOrdersForAdmin:", error);
    return [];
  }
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
    let query = supabase
      .from("orders")
      .select("*")
      .eq("session_id", sessionId)
      .is("user_id", null)
      .order("created_at", { ascending: false });

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
    const { data, error } = await supabase
      .from("orders")
      .update({ user_id: userId })
      .eq("session_id", sessionId)
      .is("user_id", null)
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
 * Insert or update the latest payment for an order, then sync orders.payment_status.
 * Uses admin client (payments writes are not open to storefront users).
 */
export async function upsertPaymentForOrder(
  input: UpsertPaymentForOrderInput,
): Promise<{ success: boolean; error?: string; data?: Payment }> {
  try {
    const supabase = createSupabaseAdminClient();
    const existing = await getPaymentByOrderIdForAdmin(input.order_id);

    const paidAt =
      input.paid_at !== undefined
        ? input.paid_at
        : input.status === "paid"
          ? new Date().toISOString()
          : null;

    const payload = {
      status: input.status,
      currency: input.currency?.trim() || "USD",
      transaction_id: input.transaction_id?.trim() || null,
      paid_at: paidAt,
      gateway: input.gateway?.trim() || null,
      payment_method: input.payment_method?.trim() || null,
      payment_url: input.payment_url?.trim() || null,
      ...(input.amount !== undefined ? { amount: input.amount } : {}),
    };

    let payment: Payment | null = null;

    if (existing) {
      const { data, error } = await supabase
        .from("payments")
        .update(payload)
        .eq("id", existing.id)
        .select()
        .single();
      if (error) {
        console.error("Error updating payment:", error);
        return { success: false, error: error.message || "Failed to update payment" };
      }
      payment = data as Payment;
    } else {
      const { data, error } = await supabase
        .from("payments")
        .insert({
          order_id: input.order_id,
          status: payload.status,
          currency: payload.currency,
          transaction_id: payload.transaction_id,
          paid_at: payload.paid_at,
          gateway: payload.gateway,
          payment_method: payload.payment_method,
          payment_url: payload.payment_url,
          ...(input.amount !== undefined ? { amount: input.amount } : {}),
        })
        .select()
        .single();
      if (error) {
        console.error("Error inserting payment:", error);
        return { success: false, error: error.message || "Failed to create payment" };
      }
      payment = data as Payment;
    }

    const { error: orderError } = await supabase
      .from("orders")
      .update({ payment_status: input.status })
      .eq("id", input.order_id);

    if (orderError) {
      console.error("Error syncing order payment_status:", orderError);
      return {
        success: false,
        error: orderError.message || "Payment saved but order status sync failed",
      };
    }

    return { success: true, data: payment ?? undefined };
  } catch (error) {
    console.error("Unexpected error in upsertPaymentForOrder:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unexpected error occurred",
    };
  }
}

/**
 * Update an order by ID (admin use).
 * Uses admin client to bypass RLS for admin operations.
 * When payment_status is set, also upserts/syncs the payments row.
 */
export async function updateOrder(
  orderId: string,
  input: {
    user_id?: string | null;
    status?: Order["status"];
    payment_status?: Order["payment_status"];
    subtotal?: number | null;
    shipping_fee?: number | null;
    discount?: number | null;
    total?: number | null;
    phone?: string | null;
    email?: string | null;
  },
): Promise<{ success: boolean; error?: string; data?: Order }> {
  try {
    const supabase = createSupabaseAdminClient();

    // Build update payload with only provided fields
    const updatePayload: Database["public"]["Tables"]["orders"]["Update"] = {};
    if (input.user_id !== undefined) updatePayload.user_id = input.user_id;
    if (input.status !== undefined) updatePayload.status = input.status;
    if (input.payment_status !== undefined) updatePayload.payment_status = input.payment_status;
    if (input.subtotal !== undefined) updatePayload.subtotal = input.subtotal;
    if (input.shipping_fee !== undefined) updatePayload.shipping_fee = input.shipping_fee;
    if (input.discount !== undefined) updatePayload.discount = input.discount;
    if (input.total !== undefined) updatePayload.total = input.total;
    if (input.phone !== undefined) updatePayload.phone = input.phone?.trim() || null;
    if (input.email !== undefined) updatePayload.email = input.email?.trim() || null;

    // If no fields to update, return early
    if (Object.keys(updatePayload).length === 0) {
      return {
        success: false,
        error: "No fields to update",
      };
    }

    const { data, error } = await supabase
      .from("orders")
      .update(updatePayload)
      .eq("id", orderId)
      .select()
      .single();

    if (error) {
      console.error("Error updating order:", error);
      return {
        success: false,
        error: error.message || "Failed to update order",
      };
    }

    if (input.payment_status !== undefined) {
      const sync = await upsertPaymentForOrder({
        order_id: orderId,
        status: input.payment_status,
        amount: (data as Order).total ?? null,
      });
      if (!sync.success) {
        return {
          success: false,
          error: sync.error || "Order updated but payment sync failed",
          data: data as Order,
        };
      }
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