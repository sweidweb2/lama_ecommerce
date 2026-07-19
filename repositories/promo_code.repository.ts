import { createSupabaseServerActionClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/** Promo code row from DB (discount_type is PostgreSQL enum 'percentage' | 'fixed'). */
export interface PromoCodeRow {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number | null;
  expires_at: string | null;
  max_uses: number | null;
  use_count: number;
  is_active: boolean;
  created_at: string;
}

export interface CreatePromoCodeInput {
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number | null;
  expires_at: string | null;
  max_uses: number | null;
  is_active: boolean;
}

export interface UpdatePromoCodeInput {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number | null;
  expires_at: string | null;
  max_uses: number | null;
  is_active: boolean;
}

/**
 * Fetch all promo codes.
 * Uses session client + admin RLS (service gates with requireAdmin).
 */
export async function getAllPromoCodes(): Promise<PromoCodeRow[]> {
  try {
    const supabase = await createSupabaseServerActionClient();
    const { data, error } = await (supabase as any)
      .from("promo_codes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch promo codes:", error);
      return [];
    }
    return (data ?? []) as PromoCodeRow[];
  } catch (error) {
    console.error("Unexpected error in getAllPromoCodes:", error);
    return [];
  }
}

/**
 * Create a promo code.
 * Uses session client + admin RLS.
 */
export async function createPromoCode(
  input: CreatePromoCodeInput,
): Promise<PromoCodeRow | null> {
  try {
    const supabase = await createSupabaseServerActionClient();
    const expiresAt = input.expires_at?.trim()
      ? new Date(input.expires_at).toISOString()
      : null;

    const { data, error } = await (supabase as any)
      .from("promo_codes")
      .insert({
        code: input.code.trim().toUpperCase(),
        discount_type: input.discount_type,
        discount_value: input.discount_value,
        expires_at: expiresAt,
        max_uses: input.max_uses ?? null,
        is_active: input.is_active ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create promo code:", error);
      return null;
    }
    return data as PromoCodeRow;
  } catch (error) {
    console.error("Unexpected error in createPromoCode:", error);
    return null;
  }
}

/**
 * Update a promo code by id.
 * Uses session client + admin RLS.
 */
export async function updatePromoCode(
  input: UpdatePromoCodeInput,
): Promise<PromoCodeRow | null> {
  try {
    const supabase = await createSupabaseServerActionClient();
    const expiresAt = input.expires_at?.trim()
      ? new Date(input.expires_at).toISOString()
      : null;

    const { data, error } = await (supabase as any)
      .from("promo_codes")
      .update({
        code: input.code.trim().toUpperCase(),
        discount_type: input.discount_type,
        discount_value: input.discount_value,
        expires_at: expiresAt,
        max_uses: input.max_uses ?? null,
        is_active: input.is_active,
      })
      .eq("id", input.id)
      .select()
      .single();

    if (error) {
      console.error("Failed to update promo code:", error);
      return null;
    }
    return data as PromoCodeRow;
  } catch (error) {
    console.error("Unexpected error in updatePromoCode:", error);
    return null;
  }
}

export async function getPromoByCodeAdmin(
  code: string,
): Promise<PromoCodeRow | null> {
  try {
    const supabase = createSupabaseAdminClient();
    const normalized = code.trim().toUpperCase();
    if (!normalized) return null;

    const { data, error } = await (supabase as any)
      .from("promo_codes")
      .select("*")
      .eq("code", normalized)
      .maybeSingle();

    if (error) {
      console.error("Failed to fetch promo by code:", error);
      return null;
    }
    return (data as PromoCodeRow) ?? null;
  } catch (error) {
    console.error("Unexpected error in getPromoByCodeAdmin:", error);
    return null;
  }
}

/**
 * Fetch a promo code by id (admin client — promo_codes RLS is admin-only).
 */
export async function getPromoCodeByIdAdmin(
  id: string,
): Promise<PromoCodeRow | null> {
  try {
    if (!id) return null;
    const supabase = createSupabaseAdminClient();
    const { data, error } = await (supabase as any)
      .from("promo_codes")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Failed to fetch promo by id:", error);
      return null;
    }
    return (data as PromoCodeRow) ?? null;
  } catch (error) {
    console.error("Unexpected error in getPromoCodeByIdAdmin:", error);
    return null;
  }
}

/**
 * Delete a promo code by id.
 * Uses session client + admin RLS.
 */
export async function deletePromoCodeById(id: string): Promise<boolean> {
  try {
    const supabase = await createSupabaseServerActionClient();
    const { error } = await (supabase as any)
      .from("promo_codes")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Failed to delete promo code:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Unexpected error in deletePromoCodeById:", error);
    return false;
  }
}
