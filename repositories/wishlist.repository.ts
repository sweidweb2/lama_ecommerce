import { createSupabaseServerComponentClient } from "@/lib/supabase/server";
import { createSupabaseServerActionClient } from "@/lib/supabase/server";

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
    const { data, error } = await (supabase as any)
      .from("wishlists")
      .insert({
        user_id: userId,
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
