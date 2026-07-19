import { createSupabaseServerComponentClient } from "@/lib/supabase/server";
import { createSupabaseServerActionClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const WISHLIST_SELECT = `
  id,
  customised_product_id,
  customised_products (
    id,
    product_id,
    color,
    size,
    material,
    products (
      id,
      name,
      slug,
      description,
      price,
      is_active,
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

/**
 * Fetch wishlist items for a user (Server Component context).
 */
export async function getWishlistItemsByUserId(
  userId: string,
): Promise<any[]> {
  try {
    const supabase = await createSupabaseServerComponentClient();
    const { data, error } = await (supabase as any)
      .from("wishlists")
      .select(WISHLIST_SELECT)
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching wishlist:", error);
      return [];
    }

    return (data ?? []).map((item: any) => {
      const productData = item.customised_products?.products;
      if (!productData) return null;
      return {
        wishlist_id: item.id,
        customised_product_id: item.customised_product_id,
        variant: {
          id: item.customised_products.id,
          color: item.customised_products.color,
          size: item.customised_products.size,
          material: item.customised_products.material,
        },
        product: {
          ...productData,
          brand: productData.brands,
          category: productData.categories,
          images: productData.product_images,
        },
      };
    }).filter(Boolean);
  } catch (error) {
    console.error("Unexpected error in getWishlistItemsByUserId:", error);
    return [];
  }
}

/**
 * Add an item to the user's wishlist (Server Action context).
 */
export async function addWishlistItem(
  userId: string,
  customisedProductId: string,
): Promise<{ success: boolean; error?: string; data?: any }> {
  try {
    const supabase = await createSupabaseServerActionClient();
    
    // Check if item already exists
    const { data: existing } = await (supabase as any)
      .from("wishlists")
      .select("id")
      .eq("user_id", userId)
      .eq("customised_product_id", customisedProductId)
      .maybeSingle();

    if (existing) {
      return { success: false, error: "Item already in wishlist" };
    }

    const { data, error } = await (supabase as any)
      .from("wishlists")
      .insert({
        user_id: userId,
        session_id: null,
        customised_product_id: customisedProductId,
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding to wishlist:", error);
      return { success: false, error: error.message };
    }
    return { success: true, data };
  } catch (error) {
    console.error("Unexpected error in addWishlistItem:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unexpected error",
    };
  }
}

/**
 * Remove a wishlist item by id (Server Action context).
 */
export async function removeWishlistItemById(
  userId: string,
  wishlistId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseServerActionClient();
    const { error } = await (supabase as any)
      .from("wishlists")
      .delete()
      .eq("id", wishlistId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error removing from wishlist:", error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (error) {
    console.error("Unexpected error in removeWishlistItemById:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unexpected error",
    };
  }
}

/**
 * Remove a wishlist item by customised product id (Server Action context).
 */
export async function removeWishlistItemByVariant(
  userId: string,
  customisedProductId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseServerActionClient();
    const { error } = await (supabase as any)
      .from("wishlists")
      .delete()
      .eq("user_id", userId)
      .eq("customised_product_id", customisedProductId);

    if (error) {
      console.error("Error removing from wishlist by variant:", error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (error) {
    console.error("Unexpected error in removeWishlistItemByVariant:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unexpected error",
    };
  }
}

/**
 * Check if a product variant is in the user's wishlist (Server Action context).
 */
export async function isInWishlist(
  userId: string,
  customisedProductId: string,
): Promise<boolean> {
  try {
    const supabase = await createSupabaseServerActionClient();
    const { data, error } = await (supabase as any)
      .from("wishlists")
      .select("id")
      .eq("user_id", userId)
      .eq("customised_product_id", customisedProductId)
      .maybeSingle();

    if (error) {
      console.error("Error checking wishlist status:", error);
      return false;
    }
    return !!data;
  } catch (error) {
    console.error("Unexpected error in isInWishlist:", error);
    return false;
  }
}

/**
 * Fetch wishlist items for a guest by session_id (Server Component context).
 * Uses service-role client; always filters by session_id.
 */
export async function getWishlistItemsBySessionId(
  sessionId: string,
): Promise<any[]> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await (supabase as any)
      .from("wishlists")
      .select(WISHLIST_SELECT)
      .eq("session_id", sessionId)
      .is("user_id", null);

    if (error) {
      console.error("Error fetching guest wishlist:", error);
      return [];
    }

    return (data ?? []).map((item: any) => {
      const productData = item.customised_products?.products;
      if (!productData) return null;
      return {
        wishlist_id: item.id,
        customised_product_id: item.customised_product_id,
        variant: {
          id: item.customised_products.id,
          color: item.customised_products.color,
          size: item.customised_products.size,
          material: item.customised_products.material,
        },
        product: {
          ...productData,
          brand: productData.brands,
          category: productData.categories,
          images: productData.product_images,
        },
      };
    }).filter(Boolean);
  } catch (error) {
    console.error("Unexpected error in getWishlistItemsBySessionId:", error);
    return [];
  }
}

/**
 * Add an item to the guest's wishlist (Server Action context).
 * Uses service-role client; always scoped to session_id.
 */
export async function addWishlistItemForGuest(
  sessionId: string,
  customisedProductId: string,
): Promise<{ success: boolean; error?: string; data?: any }> {
  try {
    const supabase = createSupabaseAdminClient();
    
    // Check if item already exists
    const { data: existing } = await (supabase as any)
      .from("wishlists")
      .select("id")
      .eq("session_id", sessionId)
      .is("user_id", null)
      .eq("customised_product_id", customisedProductId)
      .maybeSingle();

    if (existing) {
      return { success: false, error: "Item already in wishlist" };
    }

    const { data, error } = await (supabase as any)
      .from("wishlists")
      .insert({
        session_id: sessionId,
        user_id: null,
        customised_product_id: customisedProductId,
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding to guest wishlist:", error);
      return { success: false, error: error.message };
    }
    return { success: true, data };
  } catch (error) {
    console.error("Unexpected error in addWishlistItemForGuest:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unexpected error",
    };
  }
}

/**
 * Remove a wishlist item by customised product id for guest (Server Action context).
 */
export async function removeWishlistItemByVariantForGuest(
  sessionId: string,
  customisedProductId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await (supabase as any)
      .from("wishlists")
      .delete()
      .eq("session_id", sessionId)
      .is("user_id", null)
      .eq("customised_product_id", customisedProductId);

    if (error) {
      console.error("Error removing from guest wishlist by variant:", error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (error) {
    console.error("Unexpected error in removeWishlistItemByVariantForGuest:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unexpected error",
    };
  }
}

/**
 * Check if a product variant is in the guest's wishlist (Server Action context).
 */
export async function isInWishlistForGuest(
  sessionId: string,
  customisedProductId: string,
): Promise<boolean> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await (supabase as any)
      .from("wishlists")
      .select("id")
      .eq("session_id", sessionId)
      .is("user_id", null)
      .eq("customised_product_id", customisedProductId)
      .maybeSingle();

    if (error) {
      console.error("Error checking guest wishlist status:", error);
      return false;
    }
    return !!data;
  } catch (error) {
    console.error("Unexpected error in isInWishlistForGuest:", error);
    return false;
  }
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
