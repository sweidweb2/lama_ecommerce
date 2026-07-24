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
  quantity: number = 1,
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
          purchase_count: (existingStats.purchase_count || 0) + quantity,
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
          purchase_count: quantity,
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

/**
 * Get product stats for a given product.
 * Returns stats with default values (0) if no record exists.
 */
export async function getProductStatsByProductId(
  productId: string,
): Promise<ProductStats | null> {
  try {
    const supabase = createSupabaseAdminClient();

    const { data, error } = await (supabase as any)
      .from("product_stats")
      .select("*")
      .eq("product_id", productId)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "not found" which is fine
      console.error("Error fetching product stats:", error);
      return null;
    }

    // If no stats exist, return default values
    if (!data) {
      return {
        product_id: productId,
        views_count: 0,
        add_to_cart_count: 0,
        purchase_count: 0,
      };
    }

    return data as ProductStats;
  } catch (error) {
    console.error("Unexpected error in getProductStatsByProductId:", error);
    return null;
  }
}

/**
 * Product view row for admin table
 */
export interface AdminProductViewRow {
  id: string;
  product_id: string;
  product_name: string;
  user_id: string | null;
  user_name: string | null;
  session_id: string | null;
  viewed_at: string;
}

/**
 * Get product views for a specific product with pagination
 * (25 per page, capped at 1000 pages).
 */
export async function getProductViewsByProductIdForAdmin(
  productId: string,
  page: number = 1,
  pageSize: number = 25,
): Promise<{
  data: AdminProductViewRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const PRODUCT_SCOPED_VIEWS_MAX_PAGES = 1000;
  const safePageSize = pageSize > 0 ? pageSize : 25;

  try {
    const supabase = createSupabaseAdminClient();

    // Get total count for this product
    const { count, error: countError } = await (supabase as any)
      .from("product_views")
      .select("*", { count: "exact", head: true })
      .eq("product_id", productId);

    if (countError) {
      console.error("Error counting product views:", countError);
      return {
        data: [],
        total: 0,
        page: 1,
        pageSize: safePageSize,
        totalPages: 0,
      };
    }

    const total = count || 0;
    const totalPages = Math.min(
      Math.ceil(total / safePageSize) || 0,
      PRODUCT_SCOPED_VIEWS_MAX_PAGES,
    );
    const safePage =
      totalPages > 0
        ? Math.min(Math.max(1, page), totalPages)
        : 1;
    const offset = (safePage - 1) * safePageSize;

    // Fetch product views with pagination
    const { data: views, error } = await (supabase as any)
      .from("product_views")
      .select(`
        id,
        product_id,
        user_id,
        session_id,
        viewed_at
      `)
      .eq("product_id", productId)
      .order("viewed_at", { ascending: false })
      .range(offset, offset + safePageSize - 1);

    if (error) {
      console.error("Error fetching product views:", error);
      return {
        data: [],
        total: 0,
        page: safePage,
        pageSize: safePageSize,
        totalPages: 0,
      };
    }

    if (!views || views.length === 0) {
      return {
        data: [],
        total,
        page: safePage,
        pageSize: safePageSize,
        totalPages,
      };
    }

    // Get product name and user names
    const userIds = [...new Set(views.map((v: any) => v.user_id).filter(Boolean))];

    // Fetch product and profiles in parallel
    const [{ data: products }, { data: profiles }] = await Promise.all([
      (supabase as any)
        .from("products")
        .select("id, name")
        .eq("id", productId)
        .maybeSingle(),
      userIds.length
        ? (supabase as any)
            .from("profiles")
            .select("user_id, full_name")
            .in("user_id", userIds)
        : { data: [] },
    ]);

    // Create maps for quick lookup
    const productName = products?.name || "Unknown Product";
    const profileMap = new Map<string, string>();
    (profiles || []).forEach((p: { user_id: string; full_name: string | null }) => {
      profileMap.set(p.user_id, p.full_name || "Unknown");
    });

    // Map views to AdminProductViewRow format
    const mappedViews: AdminProductViewRow[] = views.map((view: any) => ({
      id: view.id,
      product_id: view.product_id,
      product_name: productName,
      user_id: view.user_id,
      user_name: view.user_id ? profileMap.get(view.user_id) || null : null,
      session_id: view.session_id,
      viewed_at: view.viewed_at,
    }));

    return {
      data: mappedViews,
      total,
      page: safePage,
      pageSize: safePageSize,
      totalPages,
    };
  } catch (error) {
    console.error("Unexpected error in getProductViewsByProductIdForAdmin:", error);
    return {
      data: [],
      total: 0,
      page: 1,
      pageSize: safePageSize,
      totalPages: 0,
    };
  }
}

/**
 * Get all product views for admin with pagination
 */
export async function getAllProductViewsForAdmin(
  page: number = 1,
  pageSize: number = 50,
): Promise<{
  data: AdminProductViewRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  try {
    const supabase = createSupabaseAdminClient();

    // Get total count
    const { count, error: countError } = await (supabase as any)
      .from("product_views")
      .select("*", { count: "exact", head: true });

    if (countError) {
      console.error("Error counting product views:", countError);
      return {
        data: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
      };
    }

    const total = count || 0;
    const totalPages = Math.min(Math.ceil(total / pageSize), 200); // Max 200 pages
    const offset = (page - 1) * pageSize;

    // Fetch product views with pagination
    const { data: views, error } = await (supabase as any)
      .from("product_views")
      .select(`
        id,
        product_id,
        user_id,
        session_id,
        viewed_at
      `)
      .order("viewed_at", { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.error("Error fetching product views:", error);
      return {
        data: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
      };
    }

    if (!views || views.length === 0) {
      return {
        data: [],
        total,
        page,
        pageSize,
        totalPages,
      };
    }

    // Get unique product IDs and user IDs
    const productIds = [...new Set(views.map((v: any) => v.product_id).filter(Boolean))];
    const userIds = [...new Set(views.map((v: any) => v.user_id).filter(Boolean))];

    // Fetch products and profiles in parallel
    const [{ data: products }, { data: profiles }] = await Promise.all([
      productIds.length
        ? (supabase as any)
            .from("products")
            .select("id, name")
            .in("id", productIds)
        : { data: [] },
      userIds.length
        ? (supabase as any)
            .from("profiles")
            .select("user_id, full_name")
            .in("user_id", userIds)
        : { data: [] },
    ]);

    // Create maps for quick lookup
    const productMap = new Map<string, string>();
    (products || []).forEach((p: { id: string; name: string }) => {
      productMap.set(p.id, p.name);
    });

    const profileMap = new Map<string, string>();
    (profiles || []).forEach((p: { user_id: string; full_name: string | null }) => {
      profileMap.set(p.user_id, p.full_name || "Unknown");
    });

    // Map views to AdminProductViewRow format
    const mappedViews: AdminProductViewRow[] = views.map((view: any) => ({
      id: view.id,
      product_id: view.product_id,
      product_name: productMap.get(view.product_id) || "Unknown Product",
      user_id: view.user_id,
      user_name: view.user_id ? profileMap.get(view.user_id) || null : null,
      session_id: view.session_id,
      viewed_at: view.viewed_at,
    }));

    return {
      data: mappedViews,
      total,
      page,
      pageSize,
      totalPages,
    };
  } catch (error) {
    console.error("Unexpected error in getAllProductViewsForAdmin:", error);
    return {
      data: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
    };
  }
}

/**
 * Product views statistics
 */
export interface ProductViewsStats {
  totalViews: number;
  uniqueProducts: number;
  uniqueUsers: number;
  viewsToday: number;
  viewsThisWeek: number;
  viewsThisMonth: number;
}

/**
 * Get product views statistics
 */
export async function getProductViewsStats(): Promise<ProductViewsStats> {
  try {
    const supabase = createSupabaseAdminClient();
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Fetch all counts in parallel
    const [
      { count: totalViews },
      { data: uniqueProductsData },
      { data: uniqueUsersData },
      { count: viewsToday },
      { count: viewsThisWeek },
      { count: viewsThisMonth },
    ] = await Promise.all([
      // Total views
      (supabase as any)
        .from("product_views")
        .select("*", { count: "exact", head: true }),
      
      // Unique products
      (supabase as any)
        .from("product_views")
        .select("product_id")
        .limit(10000), // Reasonable limit for distinct count
      
      // Unique users
      (supabase as any)
        .from("product_views")
        .select("user_id")
        .not("user_id", "is", null)
        .limit(10000),
      
      // Views today
      (supabase as any)
        .from("product_views")
        .select("*", { count: "exact", head: true })
        .gte("viewed_at", startOfToday.toISOString()),
      
      // Views this week
      (supabase as any)
        .from("product_views")
        .select("*", { count: "exact", head: true })
        .gte("viewed_at", startOfWeek.toISOString()),
      
      // Views this month
      (supabase as any)
        .from("product_views")
        .select("*", { count: "exact", head: true })
        .gte("viewed_at", startOfMonth.toISOString()),
    ]);

    // Calculate unique counts
    const uniqueProducts = new Set(
      (uniqueProductsData || []).map((v: any) => v.product_id)
    ).size;
    
    const uniqueUsers = new Set(
      (uniqueUsersData || []).map((v: any) => v.user_id).filter(Boolean)
    ).size;

    return {
      totalViews: totalViews || 0,
      uniqueProducts,
      uniqueUsers,
      viewsToday: viewsToday || 0,
      viewsThisWeek: viewsThisWeek || 0,
      viewsThisMonth: viewsThisMonth || 0,
    };
  } catch (error) {
    console.error("Error fetching product views stats:", error);
    return {
      totalViews: 0,
      uniqueProducts: 0,
      uniqueUsers: 0,
      viewsToday: 0,
      viewsThisWeek: 0,
      viewsThisMonth: 0,
    };
  }
}

/**
 * Product-scoped views statistics (for product detail page)
 */
export interface ProductScopedViewsStats {
  totalViews: number;
  uniqueUsers: number;
  guestViews: number;
  viewsToday: number;
  viewsThisWeek: number;
  viewsThisMonth: number;
}

const EMPTY_PRODUCT_SCOPED_VIEWS_STATS: ProductScopedViewsStats = {
  totalViews: 0,
  uniqueUsers: 0,
  guestViews: 0,
  viewsToday: 0,
  viewsThisWeek: 0,
  viewsThisMonth: 0,
};

/**
 * Get product views statistics for a single product
 */
export async function getProductViewsStatsByProductId(
  productId: string,
): Promise<ProductScopedViewsStats> {
  try {
    const supabase = createSupabaseAdminClient();
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      { count: totalViews },
      { data: uniqueUsersData },
      { count: guestViews },
      { count: viewsToday },
      { count: viewsThisWeek },
      { count: viewsThisMonth },
    ] = await Promise.all([
      (supabase as any)
        .from("product_views")
        .select("*", { count: "exact", head: true })
        .eq("product_id", productId),

      (supabase as any)
        .from("product_views")
        .select("user_id")
        .eq("product_id", productId)
        .not("user_id", "is", null)
        .limit(10000),

      (supabase as any)
        .from("product_views")
        .select("*", { count: "exact", head: true })
        .eq("product_id", productId)
        .is("user_id", null),

      (supabase as any)
        .from("product_views")
        .select("*", { count: "exact", head: true })
        .eq("product_id", productId)
        .gte("viewed_at", startOfToday.toISOString()),

      (supabase as any)
        .from("product_views")
        .select("*", { count: "exact", head: true })
        .eq("product_id", productId)
        .gte("viewed_at", startOfWeek.toISOString()),

      (supabase as any)
        .from("product_views")
        .select("*", { count: "exact", head: true })
        .eq("product_id", productId)
        .gte("viewed_at", startOfMonth.toISOString()),
    ]);

    const uniqueUsers = new Set(
      (uniqueUsersData || []).map((v: any) => v.user_id).filter(Boolean),
    ).size;

    return {
      totalViews: totalViews || 0,
      uniqueUsers,
      guestViews: guestViews || 0,
      viewsToday: viewsToday || 0,
      viewsThisWeek: viewsThisWeek || 0,
      viewsThisMonth: viewsThisMonth || 0,
    };
  } catch (error) {
    console.error("Error fetching product-scoped views stats:", error);
    return EMPTY_PRODUCT_SCOPED_VIEWS_STATS;
  }
}