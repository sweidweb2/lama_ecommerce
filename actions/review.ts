"use server";

import { getCurrentAuthUserFromAction } from "@/repositories/auth.repository";
import {
  createReviewService,
  updateReviewService,
  deleteReviewService,
} from "@/services/review.service";
import { revalidatePath } from "next/cache";
import { getAdminShopBlockForCurrentUser } from "@/lib/auth/require-customer-shop";

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
  // Authorization check: User must be logged in
  const user = await getCurrentAuthUserFromAction();
  if (!user) {
    return {
      success: false,
      error: "You must be logged in to update a review",
    };
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
  // Authorization check: User must be logged in
  const user = await getCurrentAuthUserFromAction();
  if (!user) {
    return {
      success: false,
      error: "You must be logged in to delete a review",
    };
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
