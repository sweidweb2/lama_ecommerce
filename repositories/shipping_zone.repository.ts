import { createSupabaseServerActionClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/** Shipping zone with optional fee for admin list/detail. */
export interface ShippingZoneWithFee {
  id: string;
  name: string;
  estimated_time: string | null;
  created_at: string;
  fee: number | null;
}

export interface CreateShippingZoneInput {
  name: string;
  estimated_time: string | null;
  fee: number | null;
}

export interface UpdateShippingZoneInput {
  id: string;
  name: string;
  estimated_time: string | null;
  fee: number | null;
}

/**
 * Fetch a single shipping zone with its fee by id.
 * Used for checkout validation without loading every zone.
 */
export async function getShippingZoneWithFeeById(
  zoneId: string,
): Promise<ShippingZoneWithFee | null> {
  try {
    const supabase = await createSupabaseServerActionClient();
    const { data: zone, error: zoneError } = await (supabase as any)
      .from("shipping_zones")
      .select("id, name, estimated_time, created_at")
      .eq("id", zoneId)
      .maybeSingle();

    if (zoneError) {
      console.error("Failed to fetch shipping zone by id:", zoneError);
      return null;
    }
    if (!zone) return null;

    const { data: feeRow, error: feeError } = await (supabase as any)
      .from("shipping_fees")
      .select("fee")
      .eq("zone_id", zoneId)
      .limit(1)
      .maybeSingle();

    if (feeError) {
      console.error("Failed to fetch shipping fee by zone id:", feeError);
      return { ...zone, fee: null };
    }

    return { ...zone, fee: feeRow?.fee ?? null };
  } catch (error) {
    console.error("Unexpected error in getShippingZoneWithFeeById:", error);
    return null;
  }
}

/**
 * Fetch all shipping zones with their fee (first shipping_fee row per zone).
 * Uses session client + admin RLS (service gates with requireAdmin).
 */
export async function getAllShippingZonesWithFee(): Promise<ShippingZoneWithFee[]> {
  try {
    const supabase = await createSupabaseServerActionClient();
    const { data: zones, error: zonesError } = await (supabase as any)
      .from("shipping_zones")
      .select("id, name, estimated_time, created_at")
      .order("created_at", { ascending: false });

    if (zonesError) {
      console.error("Failed to fetch shipping zones:", zonesError);
      return [];
    }

    if (!zones?.length) return [];

    const zoneIds = zones.map((z: { id: string }) => z.id);
    const { data: fees, error: feesError } = await (supabase as any)
      .from("shipping_fees")
      .select("zone_id, fee")
      .in("zone_id", zoneIds);

    if (feesError) {
      console.error("Failed to fetch shipping fees:", feesError);
      return zones.map((z: ShippingZoneWithFee) => ({ ...z, fee: null }));
    }

    const feeByZone = new Map<string, number | null>();
    for (const f of fees ?? []) {
      if (!feeByZone.has(f.zone_id)) feeByZone.set(f.zone_id, f.fee);
    }

    return zones.map((z: Omit<ShippingZoneWithFee, "fee">) => ({
      ...z,
      fee: feeByZone.get(z.id) ?? null,
    }));
  } catch (error) {
    console.error("Unexpected error in getAllShippingZonesWithFee:", error);
    return [];
  }
}

/**
 * Create a shipping zone and fee row in one DB transaction.
 */
export async function createShippingZoneWithFee(
  input: CreateShippingZoneInput,
): Promise<ShippingZoneWithFee | null> {
  try {
    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase.rpc("create_shipping_zone_with_fee", {
      p_name: input.name.trim(),
      p_estimated_time: input.estimated_time?.trim() || null,
      p_fee: input.fee,
    });

    if (error) {
      console.error("Failed to create shipping zone:", error);
      return null;
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      estimated_time: row.estimated_time,
      created_at: row.created_at,
      fee: row.fee,
    };
  } catch (error) {
    console.error("Unexpected error in createShippingZoneWithFee:", error);
    return null;
  }
}

/**
 * Update a shipping zone and its fee row in one DB transaction.
 */
export async function updateShippingZoneWithFee(
  input: UpdateShippingZoneInput,
): Promise<ShippingZoneWithFee | null> {
  try {
    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase.rpc("update_shipping_zone_with_fee", {
      p_id: input.id,
      p_name: input.name.trim(),
      p_estimated_time: input.estimated_time?.trim() || null,
      p_fee: input.fee,
    });

    if (error) {
      console.error("Failed to update shipping zone:", error);
      return null;
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      estimated_time: row.estimated_time,
      created_at: row.created_at,
      fee: row.fee,
    };
  } catch (error) {
    console.error("Unexpected error in updateShippingZoneWithFee:", error);
    return null;
  }
}

/**
 * Delete a shipping zone by id (cascade deletes shipping_fees).
 * Uses session client + admin RLS.
 */
export async function deleteShippingZoneById(zoneId: string): Promise<boolean> {
  try {
    const supabase = await createSupabaseServerActionClient();
    const { error } = await (supabase as any)
      .from("shipping_zones")
      .delete()
      .eq("id", zoneId);

    if (error) {
      console.error("Failed to delete shipping zone:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Unexpected error in deleteShippingZoneById:", error);
    return false;
  }
}
