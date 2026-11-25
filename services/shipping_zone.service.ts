import { isAdminCaller } from "@/lib/auth/require-admin-soft";
import {
  getAllShippingZonesWithFee,
  getShippingZoneWithFeeById,
  createShippingZoneWithFee,
  updateShippingZoneWithFee,
  deleteShippingZoneById,
  type ShippingZoneWithFee,
  type CreateShippingZoneInput,
  type UpdateShippingZoneInput,
} from "@/repositories/shipping_zone.repository";

type MutationOk<T> = { success: true; data: T };
type MutationFail = { success: false; error: string };
type MutationResult<T> = MutationOk<T> | MutationFail;

/**
 * Get all shipping zones with fee for public storefront (no admin check).
 * Used by the checkout form to display shipping options.
 */
export async function getPublicShippingZones(): Promise<ShippingZoneWithFee[]> {
  return getAllShippingZonesWithFee();
}

/**
 * Look up a single shipping zone by id (public/checkout validation).
 */
export async function getShippingZoneById(
  zoneId: string,
): Promise<ShippingZoneWithFee | null> {
  return getShippingZoneWithFeeById(zoneId);
}

/**
 * Get all shipping zones with fee for admin. Returns empty if caller is not admin.
 */
export async function getShippingZonesForAdmin(): Promise<ShippingZoneWithFee[]> {
  if (!(await isAdminCaller())) return [];
  return getAllShippingZonesWithFee();
}

/**
 * Create a shipping zone (and fee) as admin.
 */
export async function createShippingZoneAdmin(
  input: CreateShippingZoneInput,
): Promise<MutationResult<ShippingZoneWithFee>> {
  if (!(await isAdminCaller())) {
    return { success: false, error: "Unauthorized" };
  }
  const created = await createShippingZoneWithFee(input);
  if (!created) {
    return { success: false, error: "Create failed" };
  }
  return { success: true, data: created };
}

/**
 * Update a shipping zone (and fee) as admin.
 */
export async function updateShippingZoneAdmin(
  input: UpdateShippingZoneInput,
): Promise<MutationResult<ShippingZoneWithFee>> {
  if (!(await isAdminCaller())) {
    return { success: false, error: "Unauthorized" };
  }
  const updated = await updateShippingZoneWithFee(input);
  if (!updated) {
    return { success: false, error: "Update failed" };
  }
  return { success: true, data: updated };
}

/**
 * Delete a shipping zone as admin.
 */
export async function deleteShippingZoneAdmin(
  zoneId: string,
): Promise<MutationResult<null>> {
  if (!(await isAdminCaller())) {
    return { success: false, error: "Unauthorized" };
  }
  const ok = await deleteShippingZoneById(zoneId);
  if (!ok) {
    return { success: false, error: "Delete failed" };
  }
  return { success: true, data: null };
}
