import { createSupabaseServerActionClient } from "@/lib/supabase/server";

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
 * Create a shipping zone and one shipping_fee row.
 * Uses session client + admin RLS.
 */
export async function createShippingZoneWithFee(
  input: CreateShippingZoneInput,
): Promise<ShippingZoneWithFee | null> {
  try {
    const supabase = await createSupabaseServerActionClient();

    const { data: zone, error: zoneError } = await (supabase as any)
      .from("shipping_zones")
      .insert({
        name: input.name.trim(),
        estimated_time: input.estimated_time?.trim() || null,
      })
      .select("id, name, estimated_time, created_at")
      .single();

    if (zoneError || !zone) {
      console.error("Failed to create shipping zone:", zoneError);
      return null;
    }

    const { error: feeError } = await (supabase as any)
      .from("shipping_fees")
      .insert({
        zone_id: zone.id,
        fee: input.fee,
      });

    if (feeError) {
      console.error("Failed to create shipping fee:", feeError);
      return { ...zone, fee: null };
    }

    return { ...zone, fee: input.fee };
  } catch (error) {
    console.error("Unexpected error in createShippingZoneWithFee:", error);
    return null;
  }
}

/**
 * Update a shipping zone and its first fee row.
 * Uses session client + admin RLS.
 */
export async function updateShippingZoneWithFee(
  input: UpdateShippingZoneInput,
): Promise<ShippingZoneWithFee | null> {
  try {
    const supabase = await createSupabaseServerActionClient();

    const { data: zone, error: zoneError } = await (supabase as any)
      .from("shipping_zones")
      .update({
        name: input.name.trim(),
        estimated_time: input.estimated_time?.trim() || null,
      })
      .eq("id", input.id)
      .select("id, name, estimated_time, created_at")
      .single();

    if (zoneError || !zone) {
      console.error("Failed to update shipping zone:", zoneError);
      return null;
    }

    const { data: existingFee } = await (supabase as any)
      .from("shipping_fees")
      .select("id")
      .eq("zone_id", input.id)
      .limit(1)
      .maybeSingle();

    if (existingFee?.id) {
      await (supabase as any)
        .from("shipping_fees")
        .update({ fee: input.fee })
        .eq("id", existingFee.id);
    } else {
      await (supabase as any)
        .from("shipping_fees")
        .insert({ zone_id: input.id, fee: input.fee });
    }

    return { ...zone, fee: input.fee };
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
