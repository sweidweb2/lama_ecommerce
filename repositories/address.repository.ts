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

export type AddressMatchFields = {
  country: string;
  city: string;
  address: string;
  postal_code?: string | null;
  phone: string;
};

/**
 * Find an existing address for the user matching core fields.
 * Treats null / empty postal_code as equal. Returns first match if duplicates exist.
 */
export async function findAddressByFields(
  userId: string,
  fields: AddressMatchFields,
): Promise<UserAddress | null> {
  try {
    const supabase = await createSupabaseServerActionClient();
    const postal =
      fields.postal_code && fields.postal_code.trim().length > 0
        ? fields.postal_code.trim()
        : null;

    let query = (supabase as any)
      .from("user_addresses")
      .select("*")
      .eq("user_id", userId)
      .eq("country", fields.country)
      .eq("city", fields.city)
      .eq("address", fields.address)
      .eq("phone", fields.phone);

    if (postal === null) {
      query = query.is("postal_code", null);
    } else {
      query = query.eq("postal_code", postal);
    }

    const { data, error } = await query
      .order("created_at", { ascending: true })
      .limit(1);

    if (error) {
      console.error("Error finding address by fields:", error);
      return null;
    }

    const row = Array.isArray(data) ? data[0] : data;
    return (row as UserAddress | undefined) ?? null;
  } catch (error) {
    console.error("Unexpected error in findAddressByFields:", error);
    return null;
  }
}

/**
 * Call set_default_user_address RPC (ownership check + atomic swap).
 */
async function rpcSetDefaultAddress(
  supabase: Awaited<ReturnType<typeof createSupabaseServerActionClient>>,
  addressId: string,
): Promise<UserAddress | null> {
  const { data, error } = await (supabase as any).rpc(
    "set_default_user_address",
    { p_address_id: addressId },
  );

  if (error) {
    console.error("Error setting default address via RPC:", error);
    return null;
  }

  return (data as UserAddress | null) ?? null;
}

/**
 * Create a new address. RLS ensures user can only insert for own user_id.
 * When is_default, insert first then atomically promote via RPC (no pre-clear).
 */
export async function createAddress(
  payload: CreateAddressPayload,
): Promise<UserAddress | null> {
  try {
    const supabase = await createSupabaseServerActionClient();
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

    const created = data as UserAddress;
    if (!payload.is_default) return created;

    const asDefault = await rpcSetDefaultAddress(supabase, created.id);
    return asDefault ?? created;
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
 * When setting is_default, update first then atomically promote via RPC (no pre-clear).
 */
export async function updateAddressById(
  addressId: string,
  userId: string,
  updates: UpdateAddressPayload,
): Promise<UserAddress | null> {
  try {
    const supabase = await createSupabaseServerActionClient();
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

    if (!data) return null;

    const updated = data as UserAddress;
    if (updates.is_default !== true) return updated;

    const asDefault = await rpcSetDefaultAddress(supabase, addressId);
    return asDefault ?? updated;
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
    const { data, error } = await (supabase as any)
      .from("user_addresses")
      .delete()
      .eq("id", addressId)
      .eq("user_id", userId)
      .select("id");

    if (error) {
      console.error("Error deleting address:", error);
      return false;
    }
    return Boolean(data?.length);
  } catch (error) {
    console.error("Unexpected error in deleteAddressById:", error);
    return false;
  }
}

/**
 * Set one address as default; clear default on others for this user.
 * Uses atomic RPC (set target then clear others). userId kept for call-site
 * compatibility; ownership is enforced inside the RPC via auth.uid().
 */
export async function setDefaultAddress(
  addressId: string,
  _userId: string,
): Promise<UserAddress | null> {
  try {
    const supabase = await createSupabaseServerActionClient();
    return await rpcSetDefaultAddress(supabase, addressId);
  } catch (error) {
    console.error("Unexpected error in setDefaultAddress:", error);
    return null;
  }
}
