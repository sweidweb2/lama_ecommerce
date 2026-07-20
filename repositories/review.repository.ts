import {
  createSupabaseServerActionClient,
  createSupabaseServerComponentClient,
} from "@/lib/supabase/server";
import type { Review } from "@/types/product_utf8";

/**
 * Admin review row with product and user information.
 */
export interface AdminReviewRow {
  id: string;
  product_id: string;
  product_name: string;
  user_id: string | null;
  user_name: string | null;
  rating: number;
  title: string | null;
  comment: string | null;
  review_status: "pending" | "approved" | "rejected";
  created_at: string;
}

export type ListReviewsForAdminParams = {
  page: number;
  pageSize: number;
  status?: "pending" | "approved" | "rejected" | null;
  rating?: number | null;
  productQuery?: string | null;
};

export interface ListReviewsForAdminResult {
  items: AdminReviewRow[];
  total: number;
}

export interface AdminReviewStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  /** Average rating across approved reviews only; "0.0" when none. */
  avgRating: string;
}

async function enrichAdminReviewRows(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reviews: any[],
): Promise<AdminReviewRow[]> {
  if (!reviews.length) return [];

  const productIds = [
    ...new Set(reviews.map((r) => r.product_id).filter(Boolean)),
  ];
  const userIds = [
    ...new Set(reviews.map((r) => r.user_id).filter(Boolean)),
  ];

  const [{ data: products }, { data: profiles }] = await Promise.all([
    productIds.length
      ? supabase.from("products").select("id, name").in("id", productIds)
      : { data: [] },
    userIds.length
      ? supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", userIds)
      : { data: [] },
  ]);

  const productMap = new Map<string, string>();
  (products ?? []).forEach((p: { id: string; name: string }) => {
    productMap.set(p.id, p.name);
  });

  const profileMap = new Map<string, string>();
  (profiles ?? []).forEach(
    (p: { user_id: string; full_name: string | null }) => {
      profileMap.set(p.user_id, p.full_name || "Unknown");
    },
  );

  return reviews.map((review) => ({
    id: review.id,
    product_id: review.product_id,
    product_name: productMap.get(review.product_id) || "Unknown Product",
    user_id: review.user_id,
    user_name: review.user_id
      ? profileMap.get(review.user_id) || null
      : null,
    rating: review.rating,
    title: review.title,
    comment: review.comment,
    review_status: review.review_status,
    created_at: review.created_at,
  }));
}

/**
 * Create a new review for a product.
 * Returns the created review or null if there was an error.
 */
export async function createReview(
  userId: string,
  input: {
    product_id: string;
    rating: number;
    title?: string | null;
    comment?: string | null;
  },
): Promise<{ success: boolean; error?: string; data?: Review }> {
  try {
    const supabase = await createSupabaseServerActionClient();

    // Check if user already has a review for this product
    const { data: existingReview, error: checkError } = await supabase
      .from("reviews")
      .select("id")
      .eq("product_id", input.product_id)
      .eq("user_id", userId)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking existing review:", checkError);
      return {
        success: false,
        error: "Failed to check for existing review",
      };
    }

    if (existingReview) {
      return {
        success: false,
        error: "You have already reviewed this product",
      };
    }

    // Insert the new review
    const { data, error } = await (supabase as any)
      .from("reviews")
      .insert({
        product_id: input.product_id,
        user_id: userId,
        rating: input.rating,
        title: input.title?.trim() || null,
        comment: input.comment?.trim() || null,
        review_status: "pending", // RLS requires pending; publish via admin approve
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating review:", error);
      
      // Handle unique constraint violation
      if (error.code === "23505") {
        return {
          success: false,
          error: "You have already reviewed this product",
        };
      }

      return {
        success: false,
        error: error.message || "Failed to create review",
      };
    }

    return {
      success: true,
      data: data as Review,
    };
  } catch (error) {
    console.error("Unexpected error in createReview:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unexpected error occurred",
    };
  }
}

/**
 * Create a review as admin (any status; optional user_id).
 * Relies on "Admins can manage reviews" RLS.
 */
export async function createReviewForAdmin(input: {
  product_id: string;
  user_id?: string | null;
  rating: number;
  title?: string | null;
  comment?: string | null;
  review_status: "pending" | "approved" | "rejected";
}): Promise<{ success: boolean; error?: string; data?: Review }> {
  try {
    const supabase = await createSupabaseServerActionClient();
    const userId = input.user_id ?? null;

    if (userId) {
      const { data: existingReview, error: checkError } = await supabase
        .from("reviews")
        .select("id")
        .eq("product_id", input.product_id)
        .eq("user_id", userId)
        .maybeSingle();

      if (checkError) {
        console.error("Error checking existing review:", checkError);
        return {
          success: false,
          error: "Failed to check for existing review",
        };
      }

      if (existingReview) {
        return {
          success: false,
          error: "This user already has a review for this product",
        };
      }
    }

    const { data, error } = await (supabase as any)
      .from("reviews")
      .insert({
        product_id: input.product_id,
        user_id: userId,
        rating: input.rating,
        title: input.title?.trim() || null,
        comment: input.comment?.trim() || null,
        review_status: input.review_status,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating review (admin):", error);

      if (error.code === "23505") {
        return {
          success: false,
          error: "This user already has a review for this product",
        };
      }

      return {
        success: false,
        error: error.message || "Failed to create review",
      };
    }

    return {
      success: true,
      data: data as Review,
    };
  } catch (error) {
    console.error("Unexpected error in createReviewForAdmin:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unexpected error occurred",
    };
  }
}

/**
 * Get reviews for a product (approved only, or user's own reviews).
 * Used in Server Components.
 * 
 * Note: RLS policy automatically filters to show:
 * - Approved reviews (visible to everyone including anonymous users)
 * - User's own reviews (if logged in, even if pending/rejected)
 * 
 * We explicitly filter for approved reviews here for clarity and performance,
 * but RLS provides the security layer.
 */
export async function getProductReviews(
  productId: string,
): Promise<Review[]> {
  try {
    const supabase = await createSupabaseServerComponentClient();
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("product_id", productId)
      .eq("review_status", "approved") // Explicitly filter for approved reviews
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching reviews:", error);
      return [];
    }

    return (data || []) as Review[];
  } catch (error) {
    console.error("Unexpected error in getProductReviews:", error);
    return [];
  }
}

/**
 * Paginated reviews for admin panel with product and user information.
 */
export async function listReviewsForAdmin(
  params: ListReviewsForAdminParams,
): Promise<ListReviewsForAdminResult> {
  try {
    const supabase = await createSupabaseServerComponentClient();
    const page = Math.max(1, params.page);
    const pageSize = Math.min(Math.max(1, params.pageSize), 100);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let productIdsFilter: string[] | null = null;
    const q = params.productQuery?.trim();
    if (q) {
      const { data: matchedProducts, error: productError } = await (
        supabase as any
      )
        .from("products")
        .select("id")
        .ilike("name", `%${q}%`);

      if (productError) {
        console.error("Failed to filter products for reviews:", productError);
        return { items: [], total: 0 };
      }

      productIdsFilter = (matchedProducts ?? []).map(
        (p: { id: string }) => p.id,
      );
      if (productIdsFilter.length === 0) {
        return { items: [], total: 0 };
      }
    }

    let query = (supabase as any)
      .from("reviews")
      .select(
        "id, product_id, user_id, rating, title, comment, review_status, created_at",
        { count: "exact" },
      )
      .order("created_at", { ascending: false });

    if (params.status) {
      query = query.eq("review_status", params.status);
    }
    if (params.rating != null) {
      query = query.eq("rating", params.rating);
    }
    if (productIdsFilter) {
      query = query.in("product_id", productIdsFilter);
    }

    const { data: reviews, error: reviewsError, count } = await query.range(
      from,
      to,
    );

    if (reviewsError) {
      console.error("Failed to list reviews:", reviewsError);
      return { items: [], total: 0 };
    }

    const items = await enrichAdminReviewRows(supabase, reviews ?? []);
    return { items, total: count ?? 0 };
  } catch (error) {
    console.error("Unexpected error in listReviewsForAdmin:", error);
    return { items: [], total: 0 };
  }
}

/**
 * Exact admin review counts by status (head queries; not page-derived).
 * Avg rating is over approved reviews only (batched to avoid max_rows cap).
 */
export async function getAdminReviewStats(): Promise<AdminReviewStats> {
  const empty: AdminReviewStats = {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    avgRating: "0.0",
  };

  try {
    const supabase = await createSupabaseServerComponentClient();

    const countStatus = async (status?: "pending" | "approved" | "rejected") => {
      let query = (supabase as any)
        .from("reviews")
        .select("id", { count: "exact", head: true });
      if (status) {
        query = query.eq("review_status", status);
      }
      const { count, error } = await query;
      if (error) {
        console.error("Failed to count reviews:", error);
        return 0;
      }
      return count ?? 0;
    };

    const averageApprovedRating = async (): Promise<string> => {
      const batchSize = 1000;
      let offset = 0;
      let sum = 0;
      let n = 0;

      for (;;) {
        const { data, error } = await (supabase as any)
          .from("reviews")
          .select("rating")
          .eq("review_status", "approved")
          .range(offset, offset + batchSize - 1);

        if (error) {
          console.error("Failed to load approved ratings:", error);
          break;
        }

        const rows = (data ?? []) as { rating: number }[];
        for (const row of rows) {
          sum += row.rating;
          n += 1;
        }
        if (rows.length < batchSize) break;
        offset += batchSize;
      }

      return n > 0 ? (sum / n).toFixed(1) : "0.0";
    };

    const [total, pending, approved, rejected, avgRating] = await Promise.all([
      countStatus(),
      countStatus("pending"),
      countStatus("approved"),
      countStatus("rejected"),
      averageApprovedRating(),
    ]);

    return { total, pending, approved, rejected, avgRating };
  } catch (error) {
    console.error("Unexpected error in getAdminReviewStats:", error);
    return empty;
  }
}

/**
 * Get all reviews for admin panel with product and user information.
 * Prefer listReviewsForAdmin for paginated UI.
 */
export async function getAllReviewsForAdmin(): Promise<AdminReviewRow[]> {
  const result = await listReviewsForAdmin({
    page: 1,
    pageSize: 1000,
  });
  return result.items;
}

/**
 * Update a review by id (admin use).
 * RLS policy allows admins to update all reviews.
 */
export async function updateReview(
  reviewId: string,
  input: {
    rating?: number;
    title?: string | null;
    comment?: string | null;
    review_status?: "pending" | "approved" | "rejected";
  },
): Promise<{ success: boolean; error?: string; data?: Review }> {
  try {
    const supabase = await createSupabaseServerActionClient();

    // Build update payload with only provided fields
    const updatePayload: Record<string, unknown> = {};
    if (input.rating !== undefined) updatePayload.rating = input.rating;
    if (input.title !== undefined) updatePayload.title = input.title?.trim() || null;
    if (input.comment !== undefined) updatePayload.comment = input.comment?.trim() || null;
    if (input.review_status !== undefined) updatePayload.review_status = input.review_status;

    // If no fields to update, return early
    if (Object.keys(updatePayload).length === 0) {
      return {
        success: false,
        error: "No fields to update",
      };
    }

    const { data, error } = await (supabase as any)
      .from("reviews")
      .update(updatePayload)
      .eq("id", reviewId)
      .select()
      .single();

    if (error) {
      console.error("Error updating review:", error);
      return {
        success: false,
        error: error.message || "Failed to update review",
      };
    }

    return {
      success: true,
      data: data as Review,
    };
  } catch (error) {
    console.error("Unexpected error in updateReview:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unexpected error occurred",
    };
  }
}

/**
 * Hard-delete a review (admin use).
 * RLS policy allows admins to delete all reviews.
 */
export async function deleteReview(reviewId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseServerActionClient();

    const { error } = await (supabase as any)
      .from("reviews")
      .delete()
      .eq("id", reviewId);

    if (error) {
      console.error("Error deleting review:", error);
      return {
        success: false,
        error: error.message || "Failed to delete review",
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Unexpected error in deleteReview:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unexpected error occurred",
    };
  }
}
