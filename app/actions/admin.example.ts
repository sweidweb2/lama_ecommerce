"use server";

/**
 * Example: Server action using permission helpers
 * 
 * This demonstrates how to use canAccessAdmin() in server actions
 * to protect admin operations.
 * 
 * Usage:
 * 
 * import { deleteProduct } from "@/app/actions/admin";
 * 
 * // In a Server Component or Server Action:
 * await deleteProduct(productId);
 */

import { getCurrentUserProfile } from "@/lib/services/profile.service";
import { canAccessAdmin } from "@/lib/auth/permissions";

/**
 * Example: Delete a product (admin only)
 * 
 * This server action checks if the user is an admin before
 * allowing the operation to proceed.
 */
export async function deleteProduct(productId: string) {
  // Get current user profile
  const profile = await getCurrentUserProfile();

  // Check if user has admin access using permission helper
  if (!canAccessAdmin(profile?.role)) {
    throw new Error("Unauthorized: Admin access required");
  }

  // Proceed with admin operation
  // ... your admin logic here ...
  
  return { success: true, message: "Product deleted successfully" };
}

/**
 * Example: Update product (admin only)
 */
export async function updateProduct(productId: string, data: unknown) {
  const profile = await getCurrentUserProfile();

  if (!canAccessAdmin(profile?.role)) {
    throw new Error("Unauthorized: Admin access required");
  }

  // Proceed with update
  // ... your admin logic here ...
  
  return { success: true };
}
