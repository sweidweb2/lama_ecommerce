import { createSupabaseServerActionClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ProductView, ProductStats } from "@/types/product_utf8";

/**
 * Track a product view.
 * For authenticated users: uses user_id
 * For guests: uses session_id
 */
export async function trackProductView(
  productId: string,
  userId: string | null,
  sessionId: string | null,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseServerActionClient();

    // Validate that either user_id or session_id is provided
    if (!userId && !sessionId) {
      return {
        success: false,
        error: "Either user_id or session_id must be provided",
      };
    }

    // Insert the product view
    const { error } = await (supabase as any)
      .from("product_views")
      .insert({
        product_id: productId,
        user_id: userId || null,
        session_id: sessionId || null,
      });

    if (error) {
      console.error("Error tracking product view:", error);
      return {
        success: false,
        error: error.message || "Failed to track product view",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error in trackProductView:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unexpected error occurred",
    };
  }
}

/**
 * Increment views_count in product_stats.
 * Creates the stats record if it doesn't exist.
 */
export async function incrementProductViewsCount(
  productId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createSupabaseAdminClient();

    // First, check if product_stats record exists
    const { data: existingStats, error: checkError } = await (supabase as any)
      .from("product_stats")
      .select("product_id, views_count")
      .eq("product_id", productId)
      .maybeSingle();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 is "not found" which is fine
      console.error("Error checking product stats:", checkError);
      return {
        success: false,
        error: checkError.message || "Failed to check product stats",
      };
    }

    if (existingStats) {
      // Update existing record
      const { error: updateError } = await (supabase as any)
        .from("product_stats")
        .update({
          views_count: (existingStats.views_count || 0) + 1,
        })
        .eq("product_id", productId);

      if (updateError) {
        console.error("Error updating product stats:", updateError);
        return {
          success: false,
          error: updateError.message || "Failed to update product stats",
        };
      }
    } else {
      // Create new record
      const { error: insertError } = await (supabase as any)
        .from("product_stats")
        .insert({
          product_id: productId,
          views_count: 1,
          add_to_cart_count: 0,
          purchase_count: 0,
        });

      if (insertError) {
        console.error("Error creating product stats:", insertError);
        return {
          success: false,
          error: insertError.message || "Failed to create product stats",
        };
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error in incrementProductViewsCount:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unexpected error occurred",
    };
  }
}

/**
 * Increment add_to_cart_count in product_stats.
 * Creates the stats record if it doesn't exist.
 */
export async function incrementProductAddToCartCount(
  productId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createSupabaseAdminClient();

    // First, check if product_stats record exists
    const { data: existingStats, error: checkError } = await (supabase as any)
      .from("product_stats")
      .select("product_id, add_to_cart_count")
      .eq("product_id", productId)
      .maybeSingle();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 is "not found" which is fine
      console.error("Error checking product stats:", checkError);
      return {
        success: false,
        error: checkError.message || "Failed to check product stats",
      };
    }

    if (existingStats) {
      // Update existing record
      const { error: updateError } = await (supabase as any)
        .from("product_stats")
        .update({
          add_to_cart_count: (existingStats.add_to_cart_count || 0) + 1,
        })
        .eq("product_id", productId);

      if (updateError) {
        console.error("Error updating product stats:", updateError);
        return {
          success: false,
          error: updateError.message || "Failed to update product stats",
        };
      }
    } else {
      // Create new record
      const { error: insertError } = await (supabase as any)
        .from("product_stats")
        .insert({
          product_id: productId,
          views_count: 0,
          add_to_cart_count: 1,
          purchase_count: 0,
        });

      if (insertError) {
        console.error("Error creating product stats:", insertError);
        return {
          success: false,
          error: insertError.message || "Failed to create product stats",
        };
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error in incrementProductAddToCartCount:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unexpected error occurred",
    };
  }
}

/**
 * Increment purchase_count in product_stats.
 * Creates the stats record if it doesn't exist.
 */
export async function incrementProductPurchaseCount(
  productId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createSupabaseAdminClient();

    // First, check if product_stats record exists
    const { data: existingStats, error: checkError } = await (supabase as any)
      .from("product_stats")
      .select("product_id, purchase_count")
      .eq("product_id", productId)
      .maybeSingle();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 is "not found" which is fine
      console.error("Error checking product stats:", checkError);
      return {
        success: false,
        error: checkError.message || "Failed to check product stats",
      };
    }

    if (existingStats) {
      // Update existing record
      const { error: updateError } = await (supabase as any)
        .from("product_stats")
        .update({
          purchase_count: (existingStats.purchase_count || 0) + 1,
        })
        .eq("product_id", productId);

      if (updateError) {
        console.error("Error updating product stats:", updateError);
        return {
          success: false,
          error: updateError.message || "Failed to update product stats",
        };
      }
    } else {
      // Create new record
      const { error: insertError } = await (supabase as any)
        .from("product_stats")
        .insert({
          product_id: productId,
          views_count: 0,
          add_to_cart_count: 0,
          purchase_count: 1,
        });

      if (insertError) {
        console.error("Error creating product stats:", insertError);
        return {
          success: false,
          error: insertError.message || "Failed to create product stats",
        };
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error in incrementProductPurchaseCount:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unexpected error occurred",
    };
  }
}
