import { createSupabaseServerComponentClient } from "@/lib/supabase/server";
import { createSupabaseServerActionClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { resolveCartUnitPrice } from "@/repositories/cart_item.repository";
import type { SessionContext } from "@/lib/auth/session-context";

const WISHLIST_SELECT = `
  id,
  customised_product_id,
  customised_products (
    id,
    product_id,
    color,
    size,
    material,
    price_override,
    products (
      id,
      name,
      slug,
      description,
      price,
      is_active,
      is_featured,
      is_trending,
      brand_id,
      category_id,
      brands (
        id,
        name,
        slug
      ),
      categories (
        id,
        name,
        slug
      ),
      product_images (
        id,
        url_image,
        is_primary
      )
    )
  )
`;

export type MappedWishlistItem = {
  wishlist_id: string;
  customised_product_id: string;
  variant: {
    id: string;
    color: string | null;
    size: string | null;
    material: string | null;
  };
  product: Record<string, unknown> | null;
  isUnavailable: boolean;
  /** COALESCE(price_override, products.price); 0 when unavailable. */
  unitPrice: number;
};

export type WishlistListResult =
  | { success: true; data: MappedWishlistItem[] }
  | { success: false; error: string; data: [] };

/**
 * Map a wishlist join row. Keeps inactive / RLS-hidden products as unavailable
 * placeholders; drops only when the customised_products join is missing.
 */
export function mapWishlistJoinRow(item: {
  id: string;
  customised_product_id: string;
  customised_products?: {
    id: string;
    color: string | null;
    size: string | null;
    material: string | null;
    price_override?: number | string | null;
    products?: Record<string, unknown> | null;
  } | null;
}): MappedWishlistItem | null {
  const customised = item.customised_products;
  if (!customised) return null;

  const variant = {
    id: customised.id,
    color: customised.color,
    size: customised.size,
    material: customised.material,
  };

  const productData = customised.products;
  if (!productData || productData.is_active === false) {
    return {
      wishlist_id: item.id,
      customised_product_id: item.customised_product_id,
      variant,
      product: null,
      isUnavailable: true,
      unitPrice: 0,
    };
  }

  const unitPrice = resolveCartUnitPrice(
    customised.price_override,
    productData.price as number | string,
  );

  return {
    wishlist_id: item.id,
    customised_product_id: item.customised_product_id,
    variant,
    product: {
      ...productData,
      brand: productData.brands,
      category: productData.categories,
      images: productData.product_images,
    },
    isUnavailable: false,
    unitPrice,
  };
}

function mapWishlistRows(data: unknown[] | null): MappedWishlistItem[] {
  return (data ?? [])
    .map((item) => mapWishlistJoinRow(item as Parameters<typeof mapWishlistJoinRow>[0]))
    .filter((item): item is MappedWishlistItem => item !== null);
}

type WishlistSession = SessionContext;
type WishlistMutationResult = { success: boolean; error?: string };

/** Identifier fields for logs (never mixes user and guest ids). */
function wishlistLogContext(session: WishlistSession) {
  return session.kind === "user"
    ? { kind: "user" as const, userId: session.userId }
    : { kind: "guest" as const, sessionId: session.sessionId };
}

/**
 * Supabase client per ownership:
 * - user: session client (RLS) — Server Component for reads, Server Action for writes
 * - guest: service-role client (guest rows are not reachable via anon RLS)
 */
async function getWishlistClient(
  session: WishlistSession,
  context: "component" | "action",
) {
  if (session.kind === "guest") return createSupabaseAdminClient();
  return context === "component"
    ? await createSupabaseServerComponentClient()
    : await createSupabaseServerActionClient();
}

/**
 * Scope a wishlist query to its owner:
 * users by `user_id`, guests by `session_id` with `user_id IS NULL`.
 */
function scopeToOwner(query: any, session: WishlistSession) {
  return session.kind === "user"
    ? query.eq("user_id", session.userId)
    : query.eq("session_id", session.sessionId).is("user_id", null);
}

/** Ownership columns for inserts (exactly one owner column is set). */
function ownerInsertColumns(session: WishlistSession) {
  return session.kind === "user"
    ? { user_id: session.userId, session_id: null }
    : { session_id: session.sessionId, user_id: null };
}

function unexpectedErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected error";
}

/**
 * Fetch wishlist items for the session.
 * Users: Server Component client + RLS. Guests: service role scoped by session_id.
 * Empty wishlist is success with `data: []`; DB failures are `success: false`.
 */
export async function getWishlistItemsForSession(
  session: WishlistSession,
): Promise<WishlistListResult> {
  try {
    const supabase = await getWishlistClient(session, "component");
    const { data, error } = await scopeToOwner(
      (supabase as any).from("wishlists").select(WISHLIST_SELECT),
      session,
    );

    if (error) {
      console.error("Error fetching wishlist:", {
        ...wishlistLogContext(session),
        error,
      });
      return {
        success: false,
        error: "Failed to load wishlist. Please try again.",
        data: [],
      };
    }

    return { success: true, data: mapWishlistRows(data) };
  } catch (error) {
    console.error("Unexpected error in getWishlistItemsForSession:", {
      ...wishlistLogContext(session),
      error,
    });
    return {
      success: false,
      error: "Failed to load wishlist. Please try again.",
      data: [],
    };
  }
}

/**
 * Count wishlist rows for the session.
 * Users: Server Component client + RLS. Guests: service role scoped by session_id.
 */
export async function countWishlistItemsForSession(
  session: WishlistSession,
): Promise<number> {
  try {
    const supabase = await getWishlistClient(session, "component");
    const { count, error } = await scopeToOwner(
      (supabase as any)
        .from("wishlists")
        .select("id", { count: "exact", head: true }),
      session,
    );

    if (error) {
      console.error("Error counting wishlist:", {
        ...wishlistLogContext(session),
        error,
      });
      return 0;
    }

    return count ?? 0;
  } catch (error) {
    console.error("Unexpected error in countWishlistItemsForSession:", error);
    return 0;
  }
}

/**
 * Add an item to the session's wishlist (Server Action context).
 * Users: session client + RLS. Guests: service role scoped by session_id.
 */
export async function addWishlistItemForSession(
  session: WishlistSession,
  customisedProductId: string,
): Promise<{ success: boolean; error?: string; data?: any }> {
  try {
    const supabase = await getWishlistClient(session, "action");

    // Check if item already exists
    const { data: existing } = await scopeToOwner(
      (supabase as any).from("wishlists").select("id"),
      session,
    )
      .eq("customised_product_id", customisedProductId)
      .maybeSingle();

    if (existing) {
      return { success: false, error: "Item already in wishlist" };
    }

    const { data, error } = await (supabase as any)
      .from("wishlists")
      .insert({
        ...ownerInsertColumns(session),
        customised_product_id: customisedProductId,
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding to wishlist:", {
        ...wishlistLogContext(session),
        error,
      });
      return { success: false, error: error.message };
    }
    return { success: true, data };
  } catch (error) {
    console.error("Unexpected error in addWishlistItemForSession:", error);
    return { success: false, error: unexpectedErrorMessage(error) };
  }
}

/**
 * Remove a wishlist item by id, scoped to the session owner (Server Action context).
 */
export async function removeWishlistItemByIdForSession(
  session: WishlistSession,
  wishlistId: string,
): Promise<WishlistMutationResult> {
  try {
    const supabase = await getWishlistClient(session, "action");
    const { data, error } = await scopeToOwner(
      (supabase as any).from("wishlists").delete().eq("id", wishlistId),
      session,
    ).select("id");

    if (error) {
      console.error("Error removing from wishlist:", {
        ...wishlistLogContext(session),
        error,
      });
      return { success: false, error: error.message };
    }
    if (!data?.length) {
      return { success: false, error: "Item not in wishlist" };
    }
    return { success: true };
  } catch (error) {
    console.error(
      "Unexpected error in removeWishlistItemByIdForSession:",
      error,
    );
    return { success: false, error: unexpectedErrorMessage(error) };
  }
}

/**
 * Remove a wishlist item by customised product id, scoped to the session owner
 * (Server Action context).
 */
export async function removeWishlistItemByVariantForSession(
  session: WishlistSession,
  customisedProductId: string,
): Promise<WishlistMutationResult> {
  try {
    const supabase = await getWishlistClient(session, "action");
    const { data, error } = await scopeToOwner(
      (supabase as any).from("wishlists").delete(),
      session,
    )
      .eq("customised_product_id", customisedProductId)
      .select("id");

    if (error) {
      console.error("Error removing from wishlist by variant:", {
        ...wishlistLogContext(session),
        error,
      });
      return { success: false, error: error.message };
    }
    if (!data?.length) {
      return { success: false, error: "Item not in wishlist" };
    }
    return { success: true };
  } catch (error) {
    console.error(
      "Unexpected error in removeWishlistItemByVariantForSession:",
      error,
    );
    return { success: false, error: unexpectedErrorMessage(error) };
  }
}

/**
 * Check if a product variant is in the session's wishlist (Server Action context).
 */
export async function isInWishlistForSession(
  session: WishlistSession,
  customisedProductId: string,
): Promise<boolean> {
  try {
    const supabase = await getWishlistClient(session, "action");
    const { data, error } = await scopeToOwner(
      (supabase as any).from("wishlists").select("id"),
      session,
    )
      .eq("customised_product_id", customisedProductId)
      .maybeSingle();

    if (error) {
      console.error("Error checking wishlist status:", {
        ...wishlistLogContext(session),
        error,
      });
      return false;
    }
    return !!data;
  } catch (error) {
    console.error("Unexpected error in isInWishlistForSession:", error);
    return false;
  }
}

// ── Thin aliases (legacy names) ──────────────────────────────────────────────

/** Fetch wishlist items for a user (Server Component context). */
export async function getWishlistItemsByUserId(
  userId: string,
): Promise<WishlistListResult> {
  return getWishlistItemsForSession({ kind: "user", userId });
}

/** Fetch wishlist items for a guest by session_id (service role). */
export async function getWishlistItemsBySessionId(
  sessionId: string,
): Promise<WishlistListResult> {
  return getWishlistItemsForSession({ kind: "guest", sessionId });
}

/** Count wishlist rows for a user. */
export async function countWishlistItemsByUserId(
  userId: string,
): Promise<number> {
  return countWishlistItemsForSession({ kind: "user", userId });
}

/** Count guest wishlist rows for a session (service role). */
export async function countWishlistItemsBySessionId(
  sessionId: string,
): Promise<number> {
  return countWishlistItemsForSession({ kind: "guest", sessionId });
}

/** Add an item to the user's wishlist (Server Action context). */
export async function addWishlistItem(
  userId: string,
  customisedProductId: string,
): Promise<{ success: boolean; error?: string; data?: any }> {
  return addWishlistItemForSession({ kind: "user", userId }, customisedProductId);
}

/** Add an item to the guest's wishlist (service role). */
export async function addWishlistItemForGuest(
  sessionId: string,
  customisedProductId: string,
): Promise<{ success: boolean; error?: string; data?: any }> {
  return addWishlistItemForSession(
    { kind: "guest", sessionId },
    customisedProductId,
  );
}

/** Remove a user's wishlist item by id. */
export async function removeWishlistItemById(
  userId: string,
  wishlistId: string,
): Promise<WishlistMutationResult> {
  return removeWishlistItemByIdForSession({ kind: "user", userId }, wishlistId);
}

/** Remove a guest's wishlist item by id (service role + session ownership). */
export async function removeWishlistItemByIdForGuest(
  sessionId: string,
  wishlistId: string,
): Promise<WishlistMutationResult> {
  return removeWishlistItemByIdForSession(
    { kind: "guest", sessionId },
    wishlistId,
  );
}

/** Remove a user's wishlist item by customised product id. */
export async function removeWishlistItemByVariant(
  userId: string,
  customisedProductId: string,
): Promise<WishlistMutationResult> {
  return removeWishlistItemByVariantForSession(
    { kind: "user", userId },
    customisedProductId,
  );
}

/** Remove a guest's wishlist item by customised product id. */
export async function removeWishlistItemByVariantForGuest(
  sessionId: string,
  customisedProductId: string,
): Promise<WishlistMutationResult> {
  return removeWishlistItemByVariantForSession(
    { kind: "guest", sessionId },
    customisedProductId,
  );
}

/** Check if a variant is in the user's wishlist. */
export async function isInWishlist(
  userId: string,
  customisedProductId: string,
): Promise<boolean> {
  return isInWishlistForSession({ kind: "user", userId }, customisedProductId);
}

/** Check if a variant is in the guest's wishlist. */
export async function isInWishlistForGuest(
  sessionId: string,
  customisedProductId: string,
): Promise<boolean> {
  return isInWishlistForSession(
    { kind: "guest", sessionId },
    customisedProductId,
  );
}

/**
 * Claim guest wishlist rows onto a user account (login handoff).
 * Service role — RLS only allows user_id = auth.uid() and has no UPDATE policy.
 * Dupes (same customised_product_id already on user) are deleted; others move to user_id.
 */
export async function claimWishlistBySessionId(
  sessionId: string,
  userId: string,
): Promise<{ success: boolean; error?: string; claimedCount: number }> {
  try {
    const supabase = createSupabaseAdminClient();

    const { data: guestRows, error: guestError } = await (supabase as any)
      .from("wishlists")
      .select("id, customised_product_id")
      .eq("session_id", sessionId)
      .is("user_id", null);

    if (guestError) {
      console.error("Error loading guest wishlist for claim:", guestError);
      return {
        success: false,
        error: guestError.message || "Failed to claim guest wishlist",
        claimedCount: 0,
      };
    }

    const guests = (guestRows ?? []) as {
      id: string;
      customised_product_id: string;
    }[];

    if (guests.length === 0) {
      return { success: true, claimedCount: 0 };
    }

    const { data: userRows, error: userError } = await (supabase as any)
      .from("wishlists")
      .select("customised_product_id")
      .eq("user_id", userId);

    if (userError) {
      console.error("Error loading user wishlist for claim:", userError);
      return {
        success: false,
        error: userError.message || "Failed to claim guest wishlist",
        claimedCount: 0,
      };
    }

    const userVariantIds = new Set(
      ((userRows ?? []) as { customised_product_id: string }[]).map(
        (r) => r.customised_product_id,
      ),
    );

    let claimedCount = 0;

    for (const row of guests) {
      if (userVariantIds.has(row.customised_product_id)) {
        const { error: deleteError } = await (supabase as any)
          .from("wishlists")
          .delete()
          .eq("id", row.id)
          .is("user_id", null);

        if (deleteError) {
          console.error("Error deleting duplicate guest wishlist row:", deleteError);
          return {
            success: false,
            error: deleteError.message || "Failed to claim guest wishlist",
            claimedCount,
          };
        }
      } else {
        const { error: updateError } = await (supabase as any)
          .from("wishlists")
          .update({ user_id: userId, session_id: null })
          .eq("id", row.id)
          .is("user_id", null);

        if (updateError) {
          console.error("Error claiming guest wishlist row:", updateError);
          return {
            success: false,
            error: updateError.message || "Failed to claim guest wishlist",
            claimedCount,
          };
        }
        userVariantIds.add(row.customised_product_id);
        claimedCount += 1;
      }
    }

    return { success: true, claimedCount };
  } catch (error) {
    console.error("Unexpected error in claimWishlistBySessionId:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to claim guest wishlist",
      claimedCount: 0,
    };
  }
}
