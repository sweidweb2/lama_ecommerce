"use server";

import { revalidatePath } from "next/cache";
import { isAdminCaller } from "@/lib/auth/require-admin-soft";
import { getPublicShippingZones } from "@/services/shipping_zone.service";
import {
  getAllShippingZonesWithFee,
  createShippingZoneWithFee,
  updateShippingZoneWithFee,
  deleteShippingZoneById,
} from "@/repositories/shipping_zone.repository";
import { createShippingZoneSchema } from "@/lib/validators/shipping_zone/create";
import { updateShippingZoneSchema } from "@/lib/validators/shipping_zone/update";

const UNAUTHORIZED = { success: false as const, error: "Unauthorized" };

/**
 * Get all shipping zones for admin. Returns empty array if not admin.
 */
export async function getShippingZonesAction() {
  if (!(await isAdminCaller())) return [];
  return await getAllShippingZonesWithFee();
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
  if (!(await isAdminCaller())) return UNAUTHORIZED;

  const parsed = createShippingZoneSchema.safeParse(payload);
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    const msg = flat.name?.[0] ?? flat.fee?.[0] ?? "Invalid input";
    return { success: false as const, error: msg };
  }

  const created = await createShippingZoneWithFee({
    name: parsed.data.name,
    estimated_time: parsed.data.estimated_time ?? null,
    fee: parsed.data.fee ?? null,
  });

  if (!created) {
    return { success: false as const, error: "Create failed" };
  }

  revalidatePath("/admin/shippings");
  return { success: true as const, data: created };
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
  if (!(await isAdminCaller())) return UNAUTHORIZED;

  const parsed = updateShippingZoneSchema.safeParse(payload);
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    const msg = flat.name?.[0] ?? flat.fee?.[0] ?? "Invalid input";
    return { success: false as const, error: msg };
  }

  const updated = await updateShippingZoneWithFee({
    id: parsed.data.id,
    name: parsed.data.name,
    estimated_time: parsed.data.estimated_time ?? null,
    fee: parsed.data.fee ?? null,
  });

  if (!updated) {
    return { success: false as const, error: "Update failed" };
  }

  revalidatePath("/admin/shippings");
  return { success: true as const, data: updated };
}

/**
 * Delete a shipping zone as admin. Revalidates /admin/shippings on success.
 */
export async function deleteShippingZoneAction(zoneId: string) {
  if (!(await isAdminCaller())) return UNAUTHORIZED;

  const ok = await deleteShippingZoneById(zoneId);
  if (!ok) {
    return { success: false as const, error: "Delete failed" };
  }
  revalidatePath("/admin/shippings");
  return { success: true as const };
}
