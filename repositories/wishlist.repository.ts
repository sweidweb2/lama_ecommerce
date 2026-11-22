import { createSupabaseServerComponentClient } from "@/lib/supabase/server";
import { createSupabaseServerActionClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { resolveCartUnitPrice } from "@/repositories/cart_item.repository";
import type { StorefrontOwner } from "@/types/storefront-owner";

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

type WishlistOwner = StorefrontOwner;
type WishlistMutationResult = { success: boolean; error?: string };

/** Identifier fields for logs (never mixes user and guest ids). */
function wishlistLogContext(owner: WishlistOwner) {
  return owner.kind === "user"
    ? { kind: "user" as const, userId: owner.userId }
    : { kind: "guest" as const, sessionId: owner.sessionId };
}

/**
 * Supabase client per ownership:
 * - user: session client (RLS) — Server Component for reads, Server Action for writes
 * - guest: service-role client (guest rows are not reachable via anon RLS)
 */
async function getWishlistClient(
  owner: WishlistOwner,
  context: "component" | "action",
) {
  if (owner.kind === "guest") return createSupabaseAdminClient();
  return context === "component"
    ? await createSupabaseServerComponentClient()
    : await createSupabaseServerActionClient();
}

/**
 * Scope a wishlist query to its owner:
 * users by `user_id`, guests by `session_id` with `user_id IS NULL`.
 */
function scopeToOwner(query: any, owner: WishlistOwner) {
  return owner.kind === "user"
    ? query.eq("user_id", owner.userId)
    : query.eq("session_id", owner.sessionId).is("user_id", null);
}

/** Ownership columns for inserts (exactly one owner column is set). */
function ownerInsertColumns(owner: WishlistOwner) {
  return owner.kind === "user"
    ? { user_id: owner.userId, session_id: null }
    : { session_id: owner.sessionId, user_id: null };
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
  owner: WishlistOwner,
): Promise<WishlistListResult> {
  try {
    const supabase = await getWishlistClient(owner, "component");
    const { data, error } = await scopeToOwner(
      (supabase as any).from("wishlists").select(WISHLIST_SELECT),
      owner,
    );

    if (error) {
      console.error("Error fetching wishlist:", {
        ...wishlistLogContext(owner),
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
      ...wishlistLogContext(owner),
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
  owner: WishlistOwner,
): Promise<number> {
  try {
    const supabase = await getWishlistClient(owner, "component");
    const { count, error } = await scopeToOwner(
      (supabase as any)
        .from("wishlists")
        .select("id", { count: "exact", head: true }),
      owner,
    );

    if (error) {
      console.error("Error counting wishlist:", {
        ...wishlistLogContext(owner),
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
  owner: WishlistOwner,
  customisedProductId: string,
): Promise<{ success: boolean; error?: string; data?: any }> {
  try {
    const supabase = await getWishlistClient(owner, "action");

    // Check if item already exists
    const { data: existing } = await scopeToOwner(
      (supabase as any).from("wishlists").select("id"),
      owner,
    )
      .eq("customised_product_id", customisedProductId)
      .maybeSingle();

    if (existing) {
      return { success: false, error: "Item already in wishlist" };
    }

    const { data, error } = await (supabase as any)
      .from("wishlists")
      .insert({
        ...ownerInsertColumns(owner),
        customised_product_id: customisedProductId,
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding to wishlist:", {
        ...wishlistLogContext(owner),
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
  owner: WishlistOwner,
  wishlistId: string,
): Promise<WishlistMutationResult> {
  try {
    const supabase = await getWishlistClient(owner, "action");
    const { data, error } = await scopeToOwner(
      (supabase as any).from("wishlists").delete().eq("id", wishlistId),
      owner,
    ).select("id");

    if (error) {
      console.error("Error removing from wishlist:", {
        ...wishlistLogContext(owner),
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
  owner: WishlistOwner,
  customisedProductId: string,
): Promise<WishlistMutationResult> {
  try {
    const supabase = await getWishlistClient(owner, "action");
    const { data, error } = await scopeToOwner(
      (supabase as any).from("wishlists").delete(),
      owner,
    )
      .eq("customised_product_id", customisedProductId)
      .select("id");

    if (error) {
      console.error("Error removing from wishlist by variant:", {
        ...wishlistLogContext(owner),
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
  owner: WishlistOwner,
  customisedProductId: string,
): Promise<boolean> {
  try {
    const supabase = await getWishlistClient(owner, "action");
    const { data, error } = await scopeToOwner(
      (supabase as any).from("wishlists").select("id"),
      owner,
    )
      .eq("customised_product_id", customisedProductId)
      .maybeSingle();

    if (error) {
      console.error("Error checking wishlist status:", {
        ...wishlistLogContext(owner),
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

/**
 * Claim guest wishlist rows onto a user account (login handoff).
 * Service role — RLS only allows user_id = auth.uid() and has no UPDATE policy.
 * Dupes (same customised_product_id already on user) are deleted; others move to user_id.
 */
/**
 * Claim guest wishlist rows for a user in one DB transaction.
 */
export async function claimWishlistBySessionId(
  sessionId: string,
  userId: string,
): Promise<{ success: boolean; error?: string; claimedCount: number }> {
  try {
    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase.rpc("claim_wishlist_by_session", {
      p_session_id: sessionId,
      p_user_id: userId,
    });

    if (error) {
      console.error("Error in claim_wishlist_by_session RPC:", error);
      return {
        success: false,
        error: error.message || "Failed to claim guest wishlist",
        claimedCount: 0,
      };
    }

    return { success: true, claimedCount: (data as number) ?? 0 };
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
