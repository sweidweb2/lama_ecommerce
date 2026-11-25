import {
  createSupabaseServerActionClient,
  createSupabaseServerComponentClient,
} from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  getStorefrontClient,
  scopeQueryToOwner,
} from "@/lib/repositories/storefront-owner-query";
import { fetchProfileNameMap } from "@/lib/repositories/profile-name-map";
import type { Cart } from "@/types/order";
import type { CreateCartInput } from "@/lib/validators/cart/create";
import type { UpdateCartInput } from "@/lib/validators/cart/update";
import type { Database } from "@/types/supabase";
import type { StorefrontOwner } from "@/types/storefront-owner";

/**
 * Create a new cart.
 * For authenticated users, user_id is set and the session client + RLS apply.
 * For guests, session_id is required and the service-role client is used
 * (guest rows are not readable/writable via anon RLS).
 */
export async function createCart(
  userId: string | null,
  input: CreateCartInput,
): Promise<{ success: boolean; error?: string; data?: Cart; code?: string }> {
  try {
    const isGuest = !userId && !!input.session_id;
    const supabase = isGuest
      ? createSupabaseAdminClient()
      : await createSupabaseServerActionClient();

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

    const { data, error } = await supabase
      .from("carts")
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error("Error creating cart:", error);
      return {
        success: false,
        error: error.message || "Failed to create cart",
        code: error.code,
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
    const { data, error } = await supabase
      .from("carts")
      .select("*")
      .eq("id", cartId)
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
    const { data, error } = await supabase
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
 * Select the most recent cart for the session owner:
 * users by `user_id`, guests by `session_id` with `user_id IS NULL`.
 */
async function selectLatestCartForSession(owner: StorefrontOwner) {
  const supabase = await getStorefrontClient(owner, "component");
  return scopeQueryToOwner(supabase.from("carts").select("*"), owner)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
}

/**
 * Check if the session (user or guest) has an active cart.
 * Returns true if at least one cart exists, false otherwise.
 * Guests use the service-role client, always filtering by session_id + user_id IS NULL.
 */
export async function hasActiveCartForSession(
  owner: StorefrontOwner,
): Promise<{ success: boolean; hasActiveCart: boolean; data?: Cart; error?: string }> {
  try {
    const { data, error } = await selectLatestCartForSession(owner);

    if (error) {
      console.error(
        owner.kind === "user"
          ? "Error checking active cart:"
          : "Error checking active cart by session:",
        error,
      );
      return {
        success: false,
        hasActiveCart: false,
        error: error.message || "Failed to check active cart",
      };
    }

    return {
      success: true,
      hasActiveCart: !!data,
      data: data as Cart | undefined,
    };
  } catch (error) {
    console.error("Unexpected error in hasActiveCartForSession:", error);
    return {
      success: false,
      hasActiveCart: false,
      error:
        error instanceof Error ? error.message : "Unexpected error occurred",
    };
  }
}

/**
 * Get the most recent cart for the session (user or guest).
 * Guests use the service-role client, always filtering by session_id + user_id IS NULL.
 */
export async function getCartForSession(
  owner: StorefrontOwner,
): Promise<{ success: boolean; error?: string; data?: Cart }> {
  try {
    const { data, error } = await selectLatestCartForSession(owner);

    if (error) {
      console.error(
        owner.kind === "user"
          ? "Error fetching user cart:"
          : "Error fetching session cart:",
        error,
      );
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
    console.error("Unexpected error in getCartForSession:", error);
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
    const updatePayload: Database["public"]["Tables"]["carts"]["Update"] = {};
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
    const { data: currentCart } = await supabase
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

    const { data, error } = await supabase
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
 * Hard-delete a cart. Cart items are removed via ON DELETE CASCADE.
 * RLS policy ensures users can only delete their own carts.
 */
export async function deleteCart(
  cartId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseServerActionClient();

    const { error } = await supabase
      .from("carts")
      .delete()
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

    const { error } = await supabase
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
  userName: string | null;
  items: number;
  total: number;
  status: string;
}

/**
 * Get all carts for admin panel with user information, item counts, and totals.
 * Uses admin client to bypass RLS for full access.
 */
export type ListCartsForAdminParams = {
  page?: number;
  pageSize?: number;
  q?: string;
};

export type ListCartsForAdminResult = {
  items: AdminCartRow[];
  total: number;
  page: number;
  pageSize: number;
};

/**
 * Paginated admin carts with batched item totals (no N+1).
 */
export async function listCartsForAdmin(
  params: ListCartsForAdminParams = {},
): Promise<ListCartsForAdminResult> {
  const pageSize = Math.min(Math.max(params.pageSize ?? 20, 1), 100);
  let page = Math.max(params.page ?? 1, 1);
  const empty: ListCartsForAdminResult = {
    items: [],
    total: 0,
    page: 1,
    pageSize,
  };

  try {
    const supabase = createSupabaseAdminClient();
    const q = params.q?.trim() ?? "";

    const buildQuery = () => {
      let query = supabase
        .from("carts")
        .select(
          `
          id,
          user_id,
          session_id,
          created_at,
          updated_at
        `,
          { count: "exact" },
        )
        .order("created_at", { ascending: false });

      if (q) {
        const safe = q.replace(/[%_,.()\\]/g, "").slice(0, 64);
        const isUuid =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
            safe,
          );
        if (isUuid) {
          query = query.or(`id.eq.${safe},session_id.eq.${safe}`);
        } else if (safe) {
          query = query.ilike("session_id", `%${safe}%`);
        }
      }

      return query;
    };

    let from = (page - 1) * pageSize;
    let to = from + pageSize - 1;
    let { data: carts, error: cartsError, count } = await buildQuery().range(
      from,
      to,
    );

    if (cartsError) {
      console.error("Error fetching carts for admin:", cartsError);
      return empty;
    }

    const total = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    if (page > totalPages && total > 0) {
      page = totalPages;
      from = (page - 1) * pageSize;
      to = from + pageSize - 1;
      ({ data: carts, error: cartsError, count } = await buildQuery().range(
        from,
        to,
      ));
      if (cartsError) {
        console.error("Error fetching carts for admin:", cartsError);
        return empty;
      }
    }

    if (!carts || carts.length === 0) {
      return { items: [], total, page, pageSize };
    }

    const profileMap = await fetchProfileNameMap(
      supabase,
      carts.map((c: { user_id: string | null }) => c.user_id),
    );

    const cartIds = carts.map((c: { id: string }) => c.id);
    const totalsByCartId = new Map<string, { items: number; total: number }>();

    if (cartIds.length > 0) {
      const { data: cartItems, error: itemsError } = await supabase
        .from("cart_items")
        .select(
          `
          cart_id,
          quantity,
          customised_products (
            price_override,
            products (
              price
            )
          )
        `,
        )
        .in("cart_id", cartIds);

      if (itemsError) {
        console.error("Error fetching cart items for admin carts:", itemsError);
      } else {
        for (const row of (cartItems ?? []) as unknown as Array<{
          cart_id: string;
          quantity: number;
          customised_products: {
            price_override: number | null;
            products: { price: number } | null;
          } | null;
        }>) {
          const cartId = row.cart_id;
          const quantity = Number(row.quantity) || 0;
          const basePrice = row.customised_products?.products?.price ?? 0;
          const override = row.customised_products?.price_override;
          const price = Number(
            override !== null && override !== undefined ? override : basePrice,
          );
          const current = totalsByCartId.get(cartId) ?? {
            items: 0,
            total: 0,
          };
          current.items += quantity;
          current.total += price * quantity;
          totalsByCartId.set(cartId, current);
        }
      }
    }

    const items: AdminCartRow[] = carts.map((cart: any) => {
      const aggregates = totalsByCartId.get(cart.id) ?? {
        items: 0,
        total: 0,
      };
      const userName = cart.user_id
        ? profileMap.get(cart.user_id) || `User ${cart.user_id}`
        : "Guest";

      return {
        id: cart.id,
        user_id: cart.user_id,
        session_id: cart.session_id,
        created_at: cart.created_at,
        updated_at: cart.updated_at,
        userName,
        items: aggregates.items,
        total: aggregates.total,
        status: "Active",
      };
    });

    return { items, total: count ?? total, page, pageSize };
  } catch (error) {
    console.error("Unexpected error in listCartsForAdmin:", error);
    return empty;
  }
}

/**
 * @deprecated Prefer listCartsForAdmin. Returns first page (max 100).
 */
export async function getAllCartsForAdmin(): Promise<AdminCartRow[]> {
  const result = await listCartsForAdmin({ page: 1, pageSize: 100 });
  return result.items;
}

/**
 * Get user IDs that have carts.
 * Uses admin client to bypass RLS for admin access.
 */
export async function getUserIdsWithActiveCarts(): Promise<string[]> {
  try {
    const supabase = createSupabaseAdminClient();
    
    const { data, error } = await supabase
      .from("carts")
      .select("user_id")
      .not("user_id", "is", null);

    if (error) {
      console.error("Error fetching user IDs with active carts:", error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Return unique user IDs
    return [...new Set(data.map((cart: any) => cart.user_id as string).filter(Boolean) as string[])];
  } catch (error) {
    console.error("Unexpected error in getUserIdsWithActiveCarts:", error);
    return [];
  }
}

/**
 * Create a cart for admin use.
 * Uses admin client to bypass RLS for admin access.
 */
export async function createCartForAdmin(
  input: { user_id?: string | null; session_id?: string | null },
): Promise<{ success: boolean; error?: string; data?: Cart }> {
  try {
    const supabase = createSupabaseAdminClient();

    // Build insert payload
    const insertPayload: Record<string, unknown> = {};
    
    if (input.user_id) {
      insertPayload.user_id = input.user_id;
    } else {
      insertPayload.user_id = null;
    }

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

    const { data, error } = await supabase
      .from("carts")
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error("Error creating cart (admin):", error);
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
    console.error("Unexpected error in createCartForAdmin:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unexpected error occurred",
    };
  }
}

/**
 * Assign a user to a cart (set user_id).
 * Uses admin client to bypass RLS since guest carts have user_id = null.
 */
export async function updateCartUserId(
  cartId: string,
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createSupabaseAdminClient();

    const { error } = await supabase
      .from("carts")
      .update({ user_id: userId })
      .eq("id", cartId);

    if (error) {
      console.error("Error updating cart user_id:", error);
      return {
        success: false,
        error: error.message || "Failed to update cart user",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error in updateCartUserId:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unexpected error occurred",
    };
  }
}

/**
 * Hard-delete a cart using admin client (bypass RLS).
 * Used for guest carts after merging, where the user_id may not match.
 * Cart items are removed via ON DELETE CASCADE.
 */
export async function deleteCartAdmin(
  cartId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createSupabaseAdminClient();

    const { error } = await supabase
      .from("carts")
      .delete()
      .eq("id", cartId);

    if (error) {
      console.error("Error deleting cart (admin):", error);
      return {
        success: false,
        error: error.message || "Failed to delete cart",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error in deleteCartAdmin:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unexpected error occurred",
    };
  }
}

/**
 * Atomically merge a guest session cart into the user's cart.
 * Creates the user cart if needed, merges/clamps quantities with stock checks,
 * and deletes the guest cart — all in one DB transaction.
 */
export async function mergeGuestCartToUser(
  userId: string,
  sessionId: string,
): Promise<{
  success: boolean;
  error?: string;
  movedCount: number;
  merged?: boolean;
  errors?: string[];
}> {
  try {
    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase.rpc("merge_guest_cart_to_user", {
      p_user_id: userId,
      p_session_id: sessionId,
    });

    if (error) {
      console.error("Error in merge_guest_cart_to_user RPC:", error);
      return {
        success: false,
        error: error.message || "Failed to merge guest cart",
        movedCount: 0,
        merged: false,
      };
    }

    const payload = data as {
      moved_count?: number;
      merged?: boolean;
      errors?: string[];
    } | null;

    const movedCount = payload?.moved_count ?? 0;
    const merged = payload?.merged ?? movedCount > 0;
    const errors = payload?.errors?.filter(Boolean) ?? [];

    return errors.length > 0
      ? { success: true, movedCount, merged, errors }
      : { success: true, movedCount, merged };
  } catch (error) {
    console.error("Unexpected error in mergeGuestCartToUser:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unexpected error occurred",
      movedCount: 0,
      merged: false,
    };
  }
}
