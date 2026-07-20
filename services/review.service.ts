import {
  createReview,
  createReviewForAdmin,
  getProductReviews,
  getAllReviewsForAdmin,
  listReviewsForAdmin,
  getAdminReviewStats,
  updateReview,
  deleteReview,
  type AdminReviewRow,
  type AdminReviewStats,
  type ListReviewsForAdminParams,
  type ListReviewsForAdminResult,
} from "@/repositories/review.repository";
import { createReviewSchema } from "@/lib/validators/product_review/create";
import { adminCreateReviewSchema } from "@/lib/validators/product_review/admin_create";
import { adminUpdateReviewSchema } from "@/lib/validators/product_review/admin_update";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getAdminShopBlockForUserId } from "@/services/profile.service";
import type { Review } from "@/types/product_utf8";

export type {
  AdminReviewRow,
  AdminReviewStats,
  ListReviewsForAdminParams,
  ListReviewsForAdminResult,
};

/**
 * Create a review for a product.
 * Validates input and checks business rules before creating the review.
 */
export async function createReviewService(
  userId: string,
  input: {
    product_id: string;
    rating: number;
    title?: string | null;
    comment?: string | null;
  },
): Promise<{ success: boolean; error?: string; data?: Review }> {
  try {
    const shopBlock = await getAdminShopBlockForUserId(userId);
    if (shopBlock) {
      return { success: false, error: shopBlock };
    }

    // Validate input using Zod schema
    const validated = createReviewSchema.parse({
      product_id: input.product_id,
      rating: input.rating,
      title: input.title || null,
      comment: input.comment || null,
    });

    // Business logic: Ensure at least rating or comment is provided
    // (Rating is required by schema, but comment should be provided for meaningful reviews)
    if (!validated.comment || validated.comment.trim().length === 0) {
      return {
        success: false,
        error: "Please provide a comment with your review",
      };
    }

    // Call repository to create the review
    return await createReview(userId, validated);
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof Error && error.name === "ZodError") {
      const zodError = error as any;
      const firstError = zodError.errors?.[0];
      return {
        success: false,
        error: firstError?.message || "Invalid review data",
      };
    }

    console.error("Error in createReviewService:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create review",
    };
  }
}

/**
 * Get reviews for a product.
 * Used in Server Components to fetch reviews.
 */
export async function getProductReviewsService(
  productId: string,
): Promise<Review[]> {
  return await getProductReviews(productId);
}

/**
 * Get all reviews for admin panel.
 * Returns reviews with product and user information.
 * Prefer listReviewsForAdminService for paginated UI.
 */
export async function getAllReviewsForAdminService(): Promise<AdminReviewRow[]> {
  await requireAdmin();
  return await getAllReviewsForAdmin();
}

/**
 * Paginated reviews for admin panel.
 */
export async function listReviewsForAdminService(
  params: ListReviewsForAdminParams,
): Promise<ListReviewsForAdminResult> {
  await requireAdmin();
  return await listReviewsForAdmin(params);
}

/**
 * Exact admin review counts by status.
 */
export async function getAdminReviewStatsService(): Promise<AdminReviewStats> {
  await requireAdmin();
  return await getAdminReviewStats();
}

/**
 * Create a review as admin (any status; optional attributed user).
 */
export async function createReviewForAdminService(input: {
  product_id: string;
  user_id?: string | null;
  rating: number;
  title?: string | null;
  comment?: string | null;
  review_status: "pending" | "approved" | "rejected";
}): Promise<{ success: boolean; error?: string; data?: Review }> {
  try {
    await requireAdmin();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const validated = adminCreateReviewSchema.parse(input);
    return await createReviewForAdmin({
      product_id: validated.product_id,
      user_id: validated.user_id ?? null,
      rating: validated.rating,
      title: validated.title ?? null,
      comment: validated.comment ?? null,
      review_status: validated.review_status,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      const zodError = error as any;
      const firstError = zodError.errors?.[0];
      return {
        success: false,
        error: firstError?.message || "Invalid review data",
      };
    }

    console.error("Error in createReviewForAdminService:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create review",
    };
  }
}

/**
 * Update a review (admin use).
 * Validates input using admin update schema before updating.
 */
export async function updateReviewService(
  reviewId: string,
  input: {
    rating?: number;
    title?: string | null;
    comment?: string | null;
    review_status?: "pending" | "approved" | "rejected";
  },
): Promise<{ success: boolean; error?: string; data?: Review }> {
  try {
    await requireAdmin();
  } catch {
    return { success: false, error: "Unauthorized" };
  }
  try {
    // Validate input using Zod schema
    const validated = adminUpdateReviewSchema.parse(input);

    // Call repository to update the review
    return await updateReview(reviewId, validated);
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof Error && error.name === "ZodError") {
      const zodError = error as any;
      const firstError = zodError.errors?.[0];
      return {
        success: false,
        error: firstError?.message || "Invalid review data",
      };
    }

    console.error("Error in updateReviewService:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update review",
    };
  }
}

/**
 * Delete a review (admin use).
 * Permanently deletes the review.
 */
export async function deleteReviewService(
  reviewId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
  } catch {
    return { success: false, error: "Unauthorized" };
  }
  return await deleteReview(reviewId);
}
