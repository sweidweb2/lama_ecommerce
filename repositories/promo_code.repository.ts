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
 * Fetch all promo codes. Uses admin client (bypasses RLS).
 */
export async function getAllPromoCodes(): Promise<PromoCodeRow[]> {
  try {
    const supabase = createSupabaseAdminClient();
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
 * Create a promo code. Uses admin client.
 */
export async function createPromoCode(
  input: CreatePromoCodeInput,
): Promise<PromoCodeRow | null> {
  try {
    const supabase = createSupabaseAdminClient();
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
 * Update a promo code by id. Uses admin client.
 */
export async function updatePromoCode(
  input: UpdatePromoCodeInput,
): Promise<PromoCodeRow | null> {
  try {
    const supabase = createSupabaseAdminClient();
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

/**
 * Delete a promo code by id. Uses admin client.
 */
export async function deletePromoCodeById(id: string): Promise<boolean> {
  try {
    const supabase = createSupabaseAdminClient();
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
