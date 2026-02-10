import { createSupabaseServerComponentClient } from "@/lib/supabase/server";
import type { Order } from "@/types/order";

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
