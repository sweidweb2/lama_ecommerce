import { isAdminCaller } from "@/lib/auth/require-admin-soft";
import {
  getAllPromoCodes,
  createPromoCode,
  updatePromoCode,
  deletePromoCodeById,
  type PromoCodeRow,
  type CreatePromoCodeInput,
  type UpdatePromoCodeInput,
} from "@/repositories/promo_code.repository";

type MutationOk<T> = { success: true; data: T };
type MutationFail = { success: false; error: string };
type MutationResult<T> = MutationOk<T> | MutationFail;

/**
 * Get all promo codes for admin. Returns empty if caller is not admin.
 */
export async function getPromoCodesForAdmin(): Promise<PromoCodeRow[]> {
  if (!(await isAdminCaller())) return [];
  return getAllPromoCodes();
}

/**
 * Create a promo code as admin.
 */
export async function createPromoCodeAdmin(
  input: CreatePromoCodeInput,
): Promise<MutationResult<PromoCodeRow>> {
  if (!(await isAdminCaller())) {
    return { success: false, error: "Unauthorized" };
  }
  const created = await createPromoCode(input);
  if (!created) {
    return { success: false, error: "Create failed" };
  }
  return { success: true, data: created };
}

/**
 * Update a promo code as admin.
 */
export async function updatePromoCodeAdmin(
  input: UpdatePromoCodeInput,
): Promise<MutationResult<PromoCodeRow>> {
  if (!(await isAdminCaller())) {
    return { success: false, error: "Unauthorized" };
  }
  const updated = await updatePromoCode(input);
  if (!updated) {
    return { success: false, error: "Update failed" };
  }
  return { success: true, data: updated };
}

/**
 * Delete a promo code as admin.
 */
export async function deletePromoCodeAdmin(
  id: string,
): Promise<MutationResult<null>> {
  if (!(await isAdminCaller())) {
    return { success: false, error: "Unauthorized" };
  }
  const ok = await deletePromoCodeById(id);
  if (!ok) {
    return { success: false, error: "Delete failed" };
  }
  return { success: true, data: null };
}
