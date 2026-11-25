"use server";

import { revalidatePath } from "next/cache";
import {
  getPromoCodesForAdmin,
  createPromoCodeAdmin,
  updatePromoCodeAdmin,
  deletePromoCodeAdmin,
} from "@/services/promo_code.service";
import { createPromoCodeSchema } from "@/lib/validators/promo/create";
import { updatePromoCodeFullSchema } from "@/lib/validators/promo/update";

/**
 * Get all promo codes for admin. Returns empty array if not admin.
 */
export async function getPromoCodesAction() {
  return await getPromoCodesForAdmin();
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

  const result = await createPromoCodeAdmin({
    code: parsed.data.code,
    discount_type: parsed.data.discount_type,
    discount_value: parsed.data.discount_value,
    expires_at: parsed.data.expires_at ?? null,
    max_uses: parsed.data.max_uses ?? null,
    is_active: parsed.data.is_active ?? true,
  });

  if (!result.success) {
    return { success: false as const, error: result.error };
  }

  revalidatePath("/admin/promocodes");
  return { success: true as const, data: result.data };
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

  const result = await updatePromoCodeAdmin({
    id: parsed.data.id,
    code: parsed.data.code,
    discount_type: parsed.data.discount_type,
    discount_value: parsed.data.discount_value,
    expires_at: parsed.data.expires_at ?? null,
    max_uses: parsed.data.max_uses ?? null,
    is_active: parsed.data.is_active ?? true,
  });

  if (!result.success) {
    return { success: false as const, error: result.error };
  }

  revalidatePath("/admin/promocodes");
  return { success: true as const, data: result.data };
}

/**
 * Delete a promo code as admin. Revalidates /admin/promocodes on success.
 */
export async function deletePromoCodeAction(id: string) {
  const result = await deletePromoCodeAdmin(id);
  if (!result.success) {
    return { success: false as const, error: result.error };
  }
  revalidatePath("/admin/promocodes");
  return { success: true as const };
}
