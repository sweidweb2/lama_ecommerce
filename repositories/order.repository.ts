import {
  createSupabaseServerComponentClient,
  createSupabaseServerActionClient,
} from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Order, OrderItem, Payment, Shipment, AddressSnapshot } from "@/types/order";

/**
 * Admin-facing order row with denormalised user name.
 * Mirrors the `orders` table plus an optional `userName` derived from `profiles.full_name`.
 */
export interface AdminOrderRow extends Order {
  userName?: string;
}

/**
 * Get orders for a specific user (non-deleted, newest first).
 */
export async function getOrdersByUserId(
  userId: string,
  limit?: number,
): Promise<Order[]> {
  try {
    const supabase = await createSupabaseServerComponentClient();
    let query = (supabase as any)
      .from("orders")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null)
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
 * Get order count for a specific user (non-deleted).
 */
export async function getOrderCountByUserId(userId: string): Promise<number> {
  try {
    const supabase = await createSupabaseServerComponentClient();
    const { count, error } = await (supabase as any)
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("deleted_at", null);

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
 * Get a single order by ID (non-deleted).
 * Uses RLS — caller must own the order (user_id = auth.uid() or user_id IS NULL for guests).
 */
export async function getOrderById(
  orderId: string,
): Promise<Order | null> {
  try {
    const supabase = await createSupabaseServerComponentClient();
    const { data, error } = await (supabase as any)
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      console.error("Error fetching order by id:", error);
      return null;
    }

    return (data as Order) ?? null;
  } catch (error) {
    console.error("Unexpected error in getOrderById:", error);
    return null;
  }
}

/**
 * Get a single order by ID (including deleted) - Admin use.
 * Uses admin client to bypass RLS and include deleted orders.
 */
export async function getOrderByIdForAdmin(
  orderId: string,
): Promise<Order | null> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await (supabase as any)
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
 * Get order items for a given order (non-deleted).
 * Uses RLS — only items belonging to the caller's orders are returned.
 */
export async function getOrderItemsByOrderId(
  orderId: string,
): Promise<OrderItem[]> {
  try {
    const supabase = await createSupabaseServerComponentClient();
    const { data, error } = await (supabase as any)
      .from("order_items")
      .select("*")
      .eq("order_id", orderId)
      .is("deleted_at", null)
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
 * Get order items for a given order (including deleted) - Admin use.
 * Uses admin client to bypass RLS and include deleted items.
 */
export async function getOrderItemsByOrderIdForAdmin(
  orderId: string,
): Promise<OrderItem[]> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await (supabase as any)
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
 * Get the payment record for an order.
 * Uses admin client because payments table has no user-facing RLS policies.
 * Access control is enforced at the service layer.
 */
export async function getPaymentByOrderId(
  orderId: string,
): Promise<Payment | null> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await (supabase as any)
      .from("payments")
      .select("*")
      .eq("order_id", orderId)
      .is("deleted_at", null)
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
 * Get the payment record for an order (including deleted) - Admin use.
 * Uses admin client and includes deleted payments.
 */
export async function getPaymentByOrderIdForAdmin(
  orderId: string,
): Promise<Payment | null> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await (supabase as any)
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
 * Get the shipment record for an order.
 * Uses admin client because shipments table has no user-facing RLS policies.
 * Access control is enforced at the service layer.
 */
export async function getShipmentByOrderId(
  orderId: string,
): Promise<Shipment | null> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await (supabase as any)
      .from("shipments")
      .select("*")
      .eq("order_id", orderId)
      .is("deleted_at", null)
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
 * Get the shipment record for an order (including deleted) - Admin use.
 * Uses admin client and includes deleted shipments.
 */
export async function getShipmentByOrderIdForAdmin(
  orderId: string,
): Promise<Shipment | null> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await (supabase as any)
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

    // Fetch all orders (including soft-deleted for full admin visibility)
    const { data: orders, error } = await (supabase as any)
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
        created_at,
        updated_at,
        deleted_at
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
        (orders as any[])
          .map((o) => o.user_id as string | null)
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    const { data: profiles } = userIds.length
      ? await (supabase as any)
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
    return (orders as Order[]).map((o: any) => ({
      ...(o as Order),
      userName: o.user_id
        ? profileMap.get(o.user_id as string) ?? "Unknown"
        : "Guest",
    }));
  } catch (error) {
    console.error("Unexpected error in getAllOrdersForAdmin:", error);
    return [];
  }
}

/**
 * Get orders for a guest session (non-deleted, newest first).
 */
export async function getOrdersBySessionId(
  sessionId: string,
  limit?: number,
): Promise<Order[]> {
  try {
    const supabase = await createSupabaseServerComponentClient();
    let query = (supabase as any)
      .from("orders")
      .select("*")
      .eq("session_id", sessionId)
      .is("user_id", null)
      .is("deleted_at", null)
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
 * Input for the process_checkout RPC function.
 */
export interface ProcessCheckoutInput {
  cart_id: string;
  user_id: string | null;
  session_id: string | null;
  shipping_fee: number;
  discount: number;
  phone: string;
  email: string;
  address_snapshot: AddressSnapshot;
}

/**
 * Execute the atomic checkout PG function via Supabase RPC.
 * This performs stock validation, order creation, order_items snapshot,
 * stock decrement, and cart soft-delete in a single transaction.
 *
 * Returns the new order ID on success.
 */
export async function processCheckout(
  input: ProcessCheckoutInput,
): Promise<{ success: boolean; error?: string; orderId?: string }> {
  try {
    const supabase = await createSupabaseServerActionClient();

    const { data, error } = await (supabase as any).rpc("process_checkout", {
      p_cart_id: input.cart_id,
      p_user_id: input.user_id,
      p_session_id: input.session_id,
      p_shipping_fee: input.shipping_fee,
      p_discount: input.discount,
      p_phone: input.phone,
      p_email: input.email,
      p_address_snapshot: input.address_snapshot,
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

/**
 * Update an order by ID (admin use).
 * Uses admin client to bypass RLS for admin operations.
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
    const updatePayload: Record<string, unknown> = {};
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

    const { data, error } = await (supabase as any)
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
 * Soft-delete order items by order ID using admin client (bypass RLS).
 * Used for admin operations to soft-delete all items associated with an order.
 */
export async function softDeleteOrderItemsByOrderId(
  orderId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createSupabaseAdminClient();

    // Validate order ID
    if (!orderId || typeof orderId !== "string") {
      return {
        success: false,
        error: "Invalid order ID",
      };
    }

    // Soft-delete all order items for this order
    const { error } = await (supabase as any)
      .from("order_items")
      .update({ deleted_at: new Date().toISOString() })
      .eq("order_id", orderId)
      .is("deleted_at", null); // Only update items that aren't already deleted

    if (error) {
      console.error("Error soft-deleting order items:", error);
      return {
        success: false,
        error: error.message || "Failed to soft-delete order items",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error in softDeleteOrderItemsByOrderId:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unexpected error occurred",
    };
  }
}

/**
 * Soft-delete an order using admin client (bypass RLS).
 * Used for admin operations to soft-delete orders.
 * Note: This does NOT automatically soft-delete order items - that must be done separately.
 */
export async function softDeleteOrderAdmin(
  orderId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createSupabaseAdminClient();

    // Validate order ID
    if (!orderId || typeof orderId !== "string") {
      return {
        success: false,
        error: "Invalid order ID",
      };
    }

    // Check if order exists and is not already deleted
    const { data: existingOrder, error: checkError } = await (supabase as any)
      .from("orders")
      .select("id, deleted_at")
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

    if (existingOrder.deleted_at) {
      return {
        success: false,
        error: "Order is already deleted",
      };
    }

    // Soft-delete the order
    const { error } = await (supabase as any)
      .from("orders")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", orderId);

    if (error) {
      console.error("Error soft-deleting order:", error);
      return {
        success: false,
        error: error.message || "Failed to soft-delete order",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error in softDeleteOrderAdmin:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unexpected error occurred",
    };
  }
}