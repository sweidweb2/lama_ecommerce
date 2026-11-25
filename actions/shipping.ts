"use server";

import { revalidatePath } from "next/cache";
import {
  getPublicShippingZones,
  getShippingZonesForAdmin,
  createShippingZoneAdmin,
  updateShippingZoneAdmin,
  deleteShippingZoneAdmin,
} from "@/services/shipping_zone.service";
import { createShippingZoneSchema } from "@/lib/validators/shipping_zone/create";
import { updateShippingZoneSchema } from "@/lib/validators/shipping_zone/update";

/**
 * Get all shipping zones for admin. Returns empty array if not admin.
 */
export async function getShippingZonesAction() {
  return await getShippingZonesForAdmin();
}

/**
 * Get all shipping zones for public use (checkout forms).
 * Returns all shipping zones with their fees.
 */
export async function getPublicShippingZonesAction() {
  const zones = await getPublicShippingZones();
  return zones.map((zone) => ({
    id: zone.id,
    name: zone.name,
    estimated_time: zone.estimated_time,
    fee: zone.fee,
  }));
}

export type CreateShippingZonePayload = {
  name: string;
  estimated_time: string | null;
  fee: number | null;
};

/**
 * Create a shipping zone as admin. Revalidates /admin/shippings on success.
 */
export async function createShippingZoneAction(payload: CreateShippingZonePayload) {
  const parsed = createShippingZoneSchema.safeParse(payload);
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    const msg = flat.name?.[0] ?? flat.fee?.[0] ?? "Invalid input";
    return { success: false as const, error: msg };
  }

  const result = await createShippingZoneAdmin({
    name: parsed.data.name,
    estimated_time: parsed.data.estimated_time ?? null,
    fee: parsed.data.fee ?? null,
  });

  if (!result.success) {
    return { success: false as const, error: result.error };
  }

  revalidatePath("/admin/shippings");
  return { success: true as const, data: result.data };
}

export type UpdateShippingZonePayload = {
  id: string;
  name: string;
  estimated_time: string | null;
  fee: number | null;
};

/**
 * Update a shipping zone as admin. Revalidates /admin/shippings on success.
 */
export async function updateShippingZoneAction(payload: UpdateShippingZonePayload) {
  const parsed = updateShippingZoneSchema.safeParse(payload);
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    const msg = flat.name?.[0] ?? flat.fee?.[0] ?? "Invalid input";
    return { success: false as const, error: msg };
  }

  const result = await updateShippingZoneAdmin({
    id: parsed.data.id,
    name: parsed.data.name,
    estimated_time: parsed.data.estimated_time ?? null,
    fee: parsed.data.fee ?? null,
  });

  if (!result.success) {
    return { success: false as const, error: result.error };
  }

  revalidatePath("/admin/shippings");
  return { success: true as const, data: result.data };
}

/**
 * Delete a shipping zone as admin. Revalidates /admin/shippings on success.
 */
export async function deleteShippingZoneAction(zoneId: string) {
  const result = await deleteShippingZoneAdmin(zoneId);
  if (!result.success) {
    return { success: false as const, error: result.error };
  }
  revalidatePath("/admin/shippings");
  return { success: true as const };
}
