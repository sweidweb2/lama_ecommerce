import {
  createSupabaseServerComponentClient,
  createSupabaseServerActionClient,
} from "@/lib/supabase/server";
import type { UserAddress } from "@/types/user";

/**
 * Get all addresses for a user (default first).
 */
export async function getAddressesByUserId(
  userId: string,
): Promise<UserAddress[]> {
  try {
    const supabase = await createSupabaseServerComponentClient();
    const { data, error } = await (supabase as any)
      .from("user_addresses")
      .select("*")
      .eq("user_id", userId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching user addresses:", error);
      return [];
    }
    return (data ?? []) as UserAddress[];
  } catch (error) {
    console.error("Unexpected error in getAddressesByUserId:", error);
    return [];
  }
}

export type CreateAddressPayload = {
  user_id: string;
  country: string;
  city: string;
  address: string;
  postal_code?: string | null;
  phone: string;
  is_default?: boolean;
};

/**
 * Create a new address. RLS ensures user can only insert for own user_id.
 */
export async function createAddress(
  payload: CreateAddressPayload,
): Promise<UserAddress | null> {
  try {
    const supabase = await createSupabaseServerActionClient();
    if (payload.is_default) {
      await (supabase as any)
        .from("user_addresses")
        .update({ is_default: false })
        .eq("user_id", payload.user_id);
    }
    const { data, error } = await (supabase as any)
      .from("user_addresses")
      .insert({
        user_id: payload.user_id,
        country: payload.country,
        city: payload.city,
        address: payload.address,
        postal_code: payload.postal_code ?? null,
        phone: payload.phone,
        is_default: payload.is_default ?? false,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating address:", error);
      return null;
    }
    return data as UserAddress;
  } catch (error) {
    console.error("Unexpected error in createAddress:", error);
    return null;
  }
}

export type UpdateAddressPayload = {
  country?: string;
  city?: string;
  address?: string;
  postal_code?: string | null;
  phone?: string;
  is_default?: boolean;
};

/**
 * Update an address by id. RLS ensures user can only update own addresses.
 */
export async function updateAddressById(
  addressId: string,
  userId: string,
  updates: UpdateAddressPayload,
): Promise<UserAddress | null> {
  try {
    const supabase = await createSupabaseServerActionClient();
    if (updates.is_default === true) {
      await (supabase as any)
        .from("user_addresses")
        .update({ is_default: false })
        .eq("user_id", userId);
    }
    const payload: Record<string, unknown> = {};
    if (updates.country !== undefined) payload.country = updates.country;
    if (updates.city !== undefined) payload.city = updates.city;
    if (updates.address !== undefined) payload.address = updates.address;
    if (updates.postal_code !== undefined) payload.postal_code = updates.postal_code;
    if (updates.phone !== undefined) payload.phone = updates.phone;
    if (updates.is_default !== undefined) payload.is_default = updates.is_default;

    const { data, error } = await (supabase as any)
      .from("user_addresses")
      .update(payload)
      .eq("id", addressId)
      .eq("user_id", userId)
      .select()
      .maybeSingle();

    if (error) {
      console.error("Error updating address:", error);
      return null;
    }
    return data as UserAddress | null;
  } catch (error) {
    console.error("Unexpected error in updateAddressById:", error);
    return null;
  }
}

/**
 * Hard-delete an address. RLS ensures user can only delete own addresses.
 */
export async function deleteAddressById(
  addressId: string,
  userId: string,
): Promise<boolean> {
  try {
    const supabase = await createSupabaseServerActionClient();
    const { error } = await (supabase as any)
      .from("user_addresses")
      .delete()
      .eq("id", addressId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error deleting address:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Unexpected error in deleteAddressById:", error);
    return false;
  }
}

/**
 * Set one address as default; clear default on others for this user.
 */
export async function setDefaultAddress(
  addressId: string,
  userId: string,
): Promise<UserAddress | null> {
  try {
    const supabase = await createSupabaseServerActionClient();
    await (supabase as any)
      .from("user_addresses")
      .update({ is_default: false })
      .eq("user_id", userId);

    const { data, error } = await (supabase as any)
      .from("user_addresses")
      .update({ is_default: true })
      .eq("id", addressId)
      .eq("user_id", userId)
      .select()
      .maybeSingle();

    if (error) {
      console.error("Error setting default address:", error);
      return null;
    }
    return data as UserAddress | null;
  } catch (error) {
    console.error("Unexpected error in setDefaultAddress:", error);
    return null;
  }
}
