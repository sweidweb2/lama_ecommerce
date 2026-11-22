import {
  getAllShippingZonesWithFee,
  type ShippingZoneWithFee,
} from "@/repositories/shipping_zone.repository";

/**
 * Get all shipping zones with fee for public storefront (no admin check).
 * Used by the checkout form to display shipping options.
 */
export async function getPublicShippingZones(): Promise<ShippingZoneWithFee[]> {
  return getAllShippingZonesWithFee();
}
