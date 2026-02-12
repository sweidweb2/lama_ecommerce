import { getCurrentUserProfile } from "@/services/profile.service";
import { ROLES } from "@/lib/constants/roles";
import {
  getAllPromoCodes,
  createPromoCode,
  updatePromoCode,
  deletePromoCodeById,
  type PromoCodeRow,
  type CreatePromoCodeInput,
  type UpdatePromoCodeInput,
} from "@/repositories/promo_code.repository";

/**
 * Get all promo codes for admin. Returns empty if caller is not admin.
 */
export async function getPromoCodesForAdmin(): Promise<PromoCodeRow[]> {
  const profile = await getCurrentUserProfile();
  if (!profile || profile.role !== ROLES.ADMIN) return [];
  return getAllPromoCodes();
}

/**
 * Create a promo code as admin. Returns null if not admin or create fails.
 */
export async function createPromoCodeAdmin(
  input: CreatePromoCodeInput,
): Promise<PromoCodeRow | null> {
  const profile = await getCurrentUserProfile();
  if (!profile || profile.role !== ROLES.ADMIN) return null;
  return createPromoCode(input);
}

/**
 * Update a promo code as admin. Returns null if not admin or update fails.
 */
export async function updatePromoCodeAdmin(
  input: UpdatePromoCodeInput,
): Promise<PromoCodeRow | null> {
  const profile = await getCurrentUserProfile();
  if (!profile || profile.role !== ROLES.ADMIN) return null;
  return updatePromoCode(input);
}

/**
 * Delete a promo code as admin. Returns false if not admin or delete fails.
 */
export async function deletePromoCodeAdmin(id: string): Promise<boolean> {
  const profile = await getCurrentUserProfile();
  if (!profile || profile.role !== ROLES.ADMIN) return false;
  return deletePromoCodeById(id);
}
