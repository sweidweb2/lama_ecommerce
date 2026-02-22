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
      .is("deleted_at", null)
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
        review_status: "approved", // New user reviews are approved by default; admin can edit
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
      .is("deleted_at", null)
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
 * Get all reviews for admin panel with product and user information.
 * Used in admin pages. RLS policy allows admins to read all reviews.
 */
export async function getAllReviewsForAdmin(): Promise<AdminReviewRow[]> {
  try {
    const supabase = await createSupabaseServerComponentClient();

    // Fetch all reviews (not deleted)
    const { data: reviews, error: reviewsError } = await (supabase as any)
      .from("reviews")
      .select("id, product_id, user_id, rating, title, comment, review_status, created_at")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (reviewsError || !reviews?.length) {
      if (reviewsError) {
        console.error("Failed to fetch reviews:", reviewsError);
      }
      return [];
    }

    // Get unique product IDs and user IDs
    const productIds = [...new Set(reviews.map((r: any) => r.product_id).filter(Boolean))];
    const userIds = [...new Set(reviews.map((r: any) => r.user_id).filter(Boolean))];

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
    (products ?? []).forEach((p: { id: string; name: string }) => {
      productMap.set(p.id, p.name);
    });

    const profileMap = new Map<string, string>();
    (profiles ?? []).forEach((p: { user_id: string; full_name: string | null }) => {
      profileMap.set(p.user_id, p.full_name || "Unknown");
    });

    // Map reviews to AdminReviewRow format
    return reviews.map((review: any) => ({
      id: review.id,
      product_id: review.product_id,
      product_name: productMap.get(review.product_id) || "Unknown Product",
      user_id: review.user_id,
      user_name: review.user_id ? profileMap.get(review.user_id) || null : null,
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      review_status: review.review_status,
      created_at: review.created_at,
    }));
  } catch (error) {
    console.error("Unexpected error in getAllReviewsForAdmin:", error);
    return [];
  }
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
 * Soft-delete a review by setting deleted_at (admin use).
 * RLS policy allows admins to delete all reviews.
 */
export async function deleteReview(reviewId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseServerActionClient();

    const { error } = await (supabase as any)
      .from("reviews")
      .update({ deleted_at: new Date().toISOString() })
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
