"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserProfile } from "@/services/profile.service";
import { getPublicShippingZones } from "@/services/shipping_zone.service";
import { ROLES } from "@/lib/constants/roles";
import {
  getAllShippingZonesWithFee,
  createShippingZoneWithFee,
  updateShippingZoneWithFee,
  deleteShippingZoneById,
} from "@/repositories/shipping_zone.repository";
import { createShippingZoneSchema } from "@/lib/validators/shipping_zone/create";
import { updateShippingZoneSchema } from "@/lib/validators/shipping_zone/update";

/** Soft admin check: callers get empty/null/false instead of a thrown error. */
async function isAdminCaller(): Promise<boolean> {
  const profile = await getCurrentUserProfile();
  return !!profile && profile.role === ROLES.ADMIN;
}

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
  const parsed = createShippingZoneSchema.safeParse(payload);
  if (!parsed.success) {
    const msg =
      parsed.error.flatten().fieldErrors.name?.[0] ??
      parsed.error.flatten().fieldErrors.fee?.[0] ??
      "Invalid input";
    return { success: false as const, error: msg };
  }

  const created = (await isAdminCaller())
    ? await createShippingZoneWithFee({
        name: parsed.data.name,
        estimated_time: parsed.data.estimated_time ?? null,
        fee: parsed.data.fee ?? null,
      })
    : null;

  if (!created) {
    return { success: false as const, error: "Forbidden or create failed" };
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
  const parsed = updateShippingZoneSchema.safeParse(payload);
  if (!parsed.success) {
    const msg =
      parsed.error.flatten().fieldErrors.name?.[0] ??
      parsed.error.flatten().fieldErrors.fee?.[0] ??
      "Invalid input";
    return { success: false as const, error: msg };
  }

  const updated = (await isAdminCaller())
    ? await updateShippingZoneWithFee({
        id: parsed.data.id,
        name: parsed.data.name,
        estimated_time: parsed.data.estimated_time ?? null,
        fee: parsed.data.fee ?? null,
      })
    : null;

  if (!updated) {
    return { success: false as const, error: "Forbidden or update failed" };
  }

  revalidatePath("/admin/shippings");
  return { success: true as const, data: updated };
}

/**
 * Delete a shipping zone as admin. Revalidates /admin/shippings on success.
 */
export async function deleteShippingZoneAction(zoneId: string) {
  const ok = (await isAdminCaller()) ? await deleteShippingZoneById(zoneId) : false;
  if (!ok) {
    return { success: false as const, error: "Forbidden or delete failed" };
  }
  revalidatePath("/admin/shippings");
  return { success: true as const };
}
