import { getCurrentUserProfile } from "@/services/profile.service";
import { ROLES } from "@/lib/constants/roles";
import {
  getAllShippingZonesWithFee,
  createShippingZoneWithFee,
  updateShippingZoneWithFee,
  deleteShippingZoneById,
  type ShippingZoneWithFee,
  type CreateShippingZoneInput,
  type UpdateShippingZoneInput,
} from "@/repositories/shipping_zone.repository";

/**
 * Get all shipping zones with fee for admin. Returns empty if caller is not admin.
 */
export async function getShippingZonesForAdmin(): Promise<ShippingZoneWithFee[]> {
  const profile = await getCurrentUserProfile();
  if (!profile || profile.role !== ROLES.ADMIN) return [];
  return getAllShippingZonesWithFee();
}

/**
 * Create a shipping zone (and fee) as admin. Returns null if not admin or creation fails.
 */
export async function createShippingZoneAdmin(
  input: CreateShippingZoneInput,
): Promise<ShippingZoneWithFee | null> {
  const profile = await getCurrentUserProfile();
  if (!profile || profile.role !== ROLES.ADMIN) return null;
  return createShippingZoneWithFee(input);
}

/**
 * Update a shipping zone (and fee) as admin. Returns null if not admin or update fails.
 */
export async function updateShippingZoneAdmin(
  input: UpdateShippingZoneInput,
): Promise<ShippingZoneWithFee | null> {
  const profile = await getCurrentUserProfile();
  if (!profile || profile.role !== ROLES.ADMIN) return null;
  return updateShippingZoneWithFee(input);
}

/**
 * Delete a shipping zone as admin. Returns false if not admin or delete fails.
 */
export async function deleteShippingZoneAdmin(zoneId: string): Promise<boolean> {
  const profile = await getCurrentUserProfile();
  if (!profile || profile.role !== ROLES.ADMIN) return false;
  return deleteShippingZoneById(zoneId);
}
