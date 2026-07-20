"use server";

import { getCurrentAuthUserFromAction } from "@/repositories/auth.repository";
import {
  createReviewService,
  createReviewForAdminService,
  updateReviewService,
  deleteReviewService,
} from "@/services/review.service";
import { revalidatePath } from "next/cache";
import { getAdminShopBlockForCurrentUser } from "@/lib/auth/require-customer-shop";
import { requireAdmin } from "@/lib/auth/require-admin";

/**
 * Create a review for a product.
 * This is the server action called from client components.
 */
export async function createReviewAction(input: {
  product_id: string;
  rating: number;
  title?: string | null;
  comment?: string | null;
}): Promise<{ success: boolean; error?: string; data?: any }> {
  const shopBlock = await getAdminShopBlockForCurrentUser();
  if (shopBlock) {
    return { success: false, error: shopBlock };
  }

  // Authorization check: User must be logged in
  const user = await getCurrentAuthUserFromAction();
  if (!user) {
    return {
      success: false,
      error: "You must be logged in to submit a review",
    };
  }

  // Call service to create the review
  const result = await createReviewService(user.id, input);

  // Revalidate the product page to show the new review
  if (result.success) {
    revalidatePath(`/products/[slug]`, "page");
    revalidatePath("/products");
  }

  return result;
}

/**
 * Create a review (admin use).
 * Supports optional user attribution and any review_status.
 */
export async function createReviewAdminAction(input: {
  product_id: string;
  user_id?: string | null;
  rating: number;
  title?: string | null;
  comment?: string | null;
  review_status: "pending" | "approved" | "rejected";
}): Promise<{ success: boolean; error?: string; data?: any }> {
  const result = await createReviewForAdminService(input);

  if (result.success) {
    revalidatePath("/admin/reviews");
    revalidatePath(`/products/[slug]`, "page");
    revalidatePath("/products");
  }

  return result;
}

/**
 * Update a review (admin use).
 * This is the server action called from admin components.
 */
export async function updateReviewAction(
  reviewId: string,
  input: {
    rating?: number;
    title?: string | null;
    comment?: string | null;
    review_status?: "pending" | "approved" | "rejected";
  },
): Promise<{ success: boolean; error?: string; data?: any }> {
  try {
    await requireAdmin();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  // Call service to update the review
  const result = await updateReviewService(reviewId, input);

  // Revalidate admin reviews page and product pages
  if (result.success) {
    revalidatePath("/admin/reviews");
    revalidatePath(`/products/[slug]`, "page");
    revalidatePath("/products");
  }

  return result;
}

/**
 * Delete a review (admin use).
 * This is the server action called from admin components.
 */
export async function deleteReviewAction(
  reviewId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  // Call service to delete the review
  const result = await deleteReviewService(reviewId);

  // Revalidate admin reviews page and product pages
  if (result.success) {
    revalidatePath("/admin/reviews");
    revalidatePath(`/products/[slug]`, "page");
    revalidatePath("/products");
  }

  return result;
}
