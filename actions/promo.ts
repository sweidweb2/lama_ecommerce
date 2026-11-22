"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  getAllPromoCodes,
  createPromoCode,
  updatePromoCode,
  deletePromoCodeById,
} from "@/repositories/promo_code.repository";
import { createPromoCodeSchema } from "@/lib/validators/promo/create";
import { updatePromoCodeFullSchema } from "@/lib/validators/promo/update";

/** Soft admin check: callers get empty/null/false instead of a thrown error. */
async function isAdminCaller(): Promise<boolean> {
  try {
    await requireAdmin();
    return true;
  } catch {
    return false;
  }
}

/**
 * Get all promo codes for admin. Returns empty array if not admin.
 */
export async function getPromoCodesAction() {
  if (!(await isAdminCaller())) return [];
  return await getAllPromoCodes();
}

export type CreatePromoCodePayload = {
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number | null;
  expires_at: string | null;
  max_uses: number | null;
  is_active: boolean;
};

/**
 * Create a promo code as admin. Revalidates /admin/promocodes on success.
 */
export async function createPromoCodeAction(payload: CreatePromoCodePayload) {
  const parsed = createPromoCodeSchema.safeParse({
    ...payload,
    discount_value: payload.discount_value ?? 0,
  });
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    const msg =
      flat.code?.[0] ??
      flat.discount_type?.[0] ??
      flat.discount_value?.[0] ??
      "Invalid input";
    return { success: false as const, error: msg };
  }

  const created = (await isAdminCaller())
    ? await createPromoCode({
        code: parsed.data.code,
        discount_type: parsed.data.discount_type,
        discount_value: parsed.data.discount_value,
        expires_at: parsed.data.expires_at ?? null,
        max_uses: parsed.data.max_uses ?? null,
        is_active: parsed.data.is_active ?? true,
      })
    : null;

  if (!created) {
    return { success: false as const, error: "Forbidden or create failed" };
  }

  revalidatePath("/admin/promocodes");
  return { success: true as const, data: created };
}

export type UpdatePromoCodePayload = {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number | null;
  expires_at: string | null;
  max_uses: number | null;
  is_active: boolean;
};

/**
 * Update a promo code as admin. Revalidates /admin/promocodes on success.
 */
export async function updatePromoCodeAction(payload: UpdatePromoCodePayload) {
  const parsed = updatePromoCodeFullSchema.safeParse({
    ...payload,
    discount_value: payload.discount_value ?? 0,
  });
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    const msg =
      flat.id?.[0] ??
      flat.code?.[0] ??
      flat.discount_type?.[0] ??
      flat.discount_value?.[0] ??
      "Invalid input";
    return { success: false as const, error: msg };
  }

  const updated = (await isAdminCaller())
    ? await updatePromoCode({
        id: parsed.data.id,
        code: parsed.data.code,
        discount_type: parsed.data.discount_type,
        discount_value: parsed.data.discount_value,
        expires_at: parsed.data.expires_at ?? null,
        max_uses: parsed.data.max_uses ?? null,
        is_active: parsed.data.is_active ?? true,
      })
    : null;

  if (!updated) {
    return { success: false as const, error: "Forbidden or update failed" };
  }

  revalidatePath("/admin/promocodes");
  return { success: true as const, data: updated };
}

/**
 * Delete a promo code as admin. Revalidates /admin/promocodes on success.
 */
export async function deletePromoCodeAction(id: string) {
  const ok = (await isAdminCaller()) ? await deletePromoCodeById(id) : false;
  if (!ok) {
    return { success: false as const, error: "Forbidden or delete failed" };
  }
  revalidatePath("/admin/promocodes");
  return { success: true as const };
}
