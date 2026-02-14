import {
  createSupabaseServerActionClient,
  createSupabaseServerComponentClient,
} from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Cart } from "@/types/order";
import type { CreateCartInput } from "@/lib/validators/cart/create";
import type { UpdateCartInput } from "@/lib/validators/cart/update";
import { getCartItemsWithProductsByCartId } from "@/repositories/cart_item.repository";

/**
 * Create a new cart.
 * For authenticated users, user_id is set automatically.
 * For guests, session_id should be provided.
 */
export async function createCart(
  userId: string | null,
  input: CreateCartInput,
): Promise<{ success: boolean; error?: string; data?: Cart }> {
  try {
    const supabase = await createSupabaseServerActionClient();

    // Build insert payload
    const insertPayload: Record<string, unknown> = {};
    
    // Set user_id if authenticated, otherwise use provided user_id or null
    if (userId) {
      insertPayload.user_id = userId;
    } else if (input.user_id) {
      insertPayload.user_id = input.user_id;
    } else {
      insertPayload.user_id = null;
    }

    // Set session_id if provided (for guests)
    if (input.session_id) {
      insertPayload.session_id = input.session_id;
    } else {
      insertPayload.session_id = null;
    }

    // Ensure at least one of user_id or session_id is present
    if (!insertPayload.user_id && !insertPayload.session_id) {
      return {
        success: false,
        error: "Either user_id or session_id must be provided",
      };
    }

    const { data, error } = await (supabase as any)
      .from("carts")
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error("Error creating cart:", error);
      return {
        success: false,
        error: error.message || "Failed to create cart",
      };
    }

    return {
      success: true,
      data: data as Cart,
    };
  } catch (error) {
    console.error("Unexpected error in createCart:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unexpected error occurred",
    };
  }
}

/**
 * Get a cart by ID.
 * RLS policy ensures users can only access their own carts.
 */
export async function getCartById(
  cartId: string,
): Promise<{ success: boolean; error?: string; data?: Cart }> {
  try {
    const supabase = await createSupabaseServerComponentClient();
    const { data, error } = await (supabase as any)
      .from("carts")
      .select("*")
      .eq("id", cartId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      console.error("Error fetching cart:", error);
      return {
        success: false,
        error: error.message || "Failed to fetch cart",
      };
    }

    if (!data) {
      return {
        success: false,
        error: "Cart not found",
      };
    }

    return {
      success: true,
      data: data as Cart,
    };
  } catch (error) {
    console.error("Unexpected error in getCartById:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unexpected error occurred",
    };
  }
}

/**
 * Get a cart by ID for admin (bypasses RLS).
 * Uses admin client to access any cart.
 */
export async function getCartByIdForAdmin(
  cartId: string,
): Promise<{ success: boolean; error?: string; data?: Cart }> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await (supabase as any)
      .from("carts")
      .select("*")
      .eq("id", cartId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching cart for admin:", error);
      return {
        success: false,
        error: error.message || "Failed to fetch cart",
      };
    }

    if (!data) {
      return {
        success: false,
        error: "Cart not found",
      };
    }

    return {
      success: true,
      data: data as Cart,
    };
  } catch (error) {
    console.error("Unexpected error in getCartByIdForAdmin:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unexpected error occurred",
    };
  }
}

/**
 * Check if a user has an active cart (deleted_at is null).
 * Returns true if the user has at least one active cart, false otherwise.
 */
export async function hasActiveCart(
  userId: string,
): Promise<{ success: boolean; hasActiveCart: boolean; data?: Cart; error?: string }> {
  try {
    const supabase = await createSupabaseServerComponentClient();
    const { data, error } = await (supabase as any)
      .from("carts")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error checking active cart:", error);
      return {
        success: false,
        hasActiveCart: false,
        error: error.message || "Failed to check active cart",
      };
    }

    const hasActive = !!data;
    return {
      success: true,
      hasActiveCart: hasActive,
      data: data as Cart | undefined,
    };
  } catch (error) {
    console.error("Unexpected error in hasActiveCart:", error);
    return {
      success: false,
      hasActiveCart: false,
      error:
        error instanceof Error ? error.message : "Unexpected error occurred",
    };
  }
}

/**
 * Get a cart for an authenticated user.
 * Returns the most recent active cart for the user.
 */
export async function getCartByUserId(
  userId: string,
): Promise<{ success: boolean; error?: string; data?: Cart }> {
  try {
    const supabase = await createSupabaseServerComponentClient();
    const { data, error } = await (supabase as any)
      .from("carts")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error fetching user cart:", error);
      return {
        success: false,
        error: error.message || "Failed to fetch cart",
      };
    }

    return {
      success: true,
      data: data as Cart | undefined,
    };
  } catch (error) {
    console.error("Unexpected error in getCartByUserId:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unexpected error occurred",
    };
  }
}

/**
 * Get a cart for a guest by session_id.
 * Returns the most recent active cart for the session.
 */
export async function getCartBySessionId(
  sessionId: string,
): Promise<{ success: boolean; error?: string; data?: Cart }> {
  try {
    const supabase = await createSupabaseServerComponentClient();
    const { data, error } = await (supabase as any)
      .from("carts")
      .select("*")
      .eq("session_id", sessionId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error fetching session cart:", error);
      return {
        success: false,
        error: error.message || "Failed to fetch cart",
      };
    }

    return {
      success: true,
      data: data as Cart | undefined,
    };
  } catch (error) {
    console.error("Unexpected error in getCartBySessionId:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unexpected error occurred",
    };
  }
}

/**
 * Update a cart.
 * Typically used to migrate a guest cart to a user cart (set user_id, clear session_id).
 */
export async function updateCart(
  cartId: string,
  input: UpdateCartInput,
): Promise<{ success: boolean; error?: string; data?: Cart }> {
  try {
    const supabase = await createSupabaseServerActionClient();

    // Build update payload with only provided fields
    const updatePayload: Record<string, unknown> = {};
    if (input.user_id !== undefined) {
      updatePayload.user_id = input.user_id;
    }
    if (input.session_id !== undefined) {
      updatePayload.session_id = input.session_id;
    }

    // If no fields to update, return early
    if (Object.keys(updatePayload).length === 0) {
      return {
        success: false,
        error: "No fields to update",
      };
    }

    // Ensure at least one of user_id or session_id is present after update
    const { data: currentCart } = await (supabase as any)
      .from("carts")
      .select("user_id, session_id")
      .eq("id", cartId)
      .single();

    if (currentCart) {
      const finalUserId = updatePayload.user_id !== undefined 
        ? updatePayload.user_id 
        : currentCart.user_id;
      const finalSessionId = updatePayload.session_id !== undefined 
        ? updatePayload.session_id 
        : currentCart.session_id;

      if (!finalUserId && !finalSessionId) {
        return {
          success: false,
          error: "Either user_id or session_id must be present",
        };
      }
    }

    const { data, error } = await (supabase as any)
      .from("carts")
      .update(updatePayload)
      .eq("id", cartId)
      .select()
      .single();

    if (error) {
      console.error("Error updating cart:", error);
      return {
        success: false,
        error: error.message || "Failed to update cart",
      };
    }

    return {
      success: true,
      data: data as Cart,
    };
  } catch (error) {
    console.error("Unexpected error in updateCart:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unexpected error occurred",
    };
  }
}

/**
 * Soft-delete a cart by setting deleted_at.
 * RLS policy ensures users can only delete their own carts.
 */
export async function deleteCart(
  cartId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseServerActionClient();

    const { error } = await (supabase as any)
      .from("carts")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", cartId);

    if (error) {
      console.error("Error deleting cart:", error);
      return {
        success: false,
        error: error.message || "Failed to delete cart",
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Unexpected error in deleteCart:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unexpected error occurred",
    };
  }
}

/**
 * Hard-delete a cart (permanently remove from database).
 * Used for admin operations. All cart items must be deleted first.
 * Uses admin client to bypass RLS for admin operations.
 */
export async function hardDeleteCart(
  cartId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createSupabaseAdminClient();

    const { error } = await (supabase as any)
      .from("carts")
      .delete()
      .eq("id", cartId);

    if (error) {
      console.error("Error hard deleting cart:", error);
      return {
        success: false,
        error: error.message || "Failed to delete cart",
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Unexpected error in hardDeleteCart:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unexpected error occurred",
    };
  }
}

/**
 * Admin cart row interface for admin panel display.
 */
export interface AdminCartRow {
  id: string;
  user_id: string | null;
  session_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  userName: string | null;
  items: number;
  total: number;
  status: string;
}

/**
 * Get all carts for admin panel with user information, item counts, and totals.
 * Uses admin client to bypass RLS for full access.
 */
export async function getAllCartsForAdmin(): Promise<AdminCartRow[]> {
  try {
    const supabase = createSupabaseAdminClient();

    // Fetch all carts (including deleted ones for admin view)
    const { data: carts, error: cartsError } = await (supabase as any)
      .from("carts")
      .select(`
        id,
        user_id,
        session_id,
        created_at,
        updated_at,
        deleted_at
      `)
      .order("created_at", { ascending: false });

    if (cartsError) {
      console.error("Error fetching carts for admin:", cartsError);
      return [];
    }

    if (!carts || carts.length === 0) {
      return [];
    }

    // Get unique user IDs
    const userIds = [
      ...new Set(carts.map((c: any) => c.user_id).filter(Boolean)),
    ];

    // Fetch profiles for user names
    const { data: profiles } = userIds.length
      ? await (supabase as any)
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", userIds)
      : { data: [] };

    // Create map for quick lookup
    const profileMap = new Map<string, string>();
    (profiles ?? []).forEach((p: { user_id: string; full_name: string | null }) => {
      profileMap.set(p.user_id, p.full_name || "Unknown");
    });

    // For each cart, get items and calculate totals
    const adminCarts: AdminCartRow[] = await Promise.all(
      carts.map(async (cart: any) => {
        // Get cart items with products to calculate totals
        const items = await getCartItemsWithProductsByCartId(cart.id);

        // Calculate item count and total
        const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
        const total = items.reduce(
          (sum, item) => sum + item.product.price * item.quantity,
          0,
        );

        // Determine status
        const status = cart.deleted_at ? "Deleted" : "Active";

        // Get user name
        const userName = cart.user_id
          ? profileMap.get(cart.user_id) || `User ${cart.user_id}`
          : "Guest";

        return {
          id: cart.id,
          user_id: cart.user_id,
          session_id: cart.session_id,
          created_at: cart.created_at,
          updated_at: cart.updated_at,
          deleted_at: cart.deleted_at,
          userName,
          items: itemCount,
          total,
          status,
        };
      }),
    );

    return adminCarts;
  } catch (error) {
    console.error("Unexpected error in getAllCartsForAdmin:", error);
    return [];
  }
}
