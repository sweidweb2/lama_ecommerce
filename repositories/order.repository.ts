import {
  createSupabaseServerComponentClient,
  createSupabaseServerActionClient,
} from "@/lib/supabase/server";
import type { Order, AddressSnapshot } from "@/types/order";

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
