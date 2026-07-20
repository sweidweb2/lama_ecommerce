import { requireAdmin } from "@/lib/auth/require-admin";
import { updateShipmentSchema } from "@/lib/validators/shipment/update";
import { updateShipment } from "@/repositories/shipment.repository";
import type { Shipment } from "@/types/order";

/**
 * Update carrier/tracking on a shipment (admin).
 */
export async function updateShipmentForAdminService(
  shipmentId: string,
  input: { carrier_name: string; tracking_number: string },
): Promise<{ success: boolean; error?: string; data?: Shipment }> {
  try {
    await requireAdmin();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  if (!shipmentId || typeof shipmentId !== "string" || shipmentId.trim() === "") {
    return { success: false, error: "Invalid shipment ID" };
  }

  const parsed = updateShipmentSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const firstKey = Object.keys(fieldErrors)[0] as
      | keyof typeof fieldErrors
      | undefined;
    const firstError = firstKey ? fieldErrors[firstKey]?.[0] : undefined;
    return {
      success: false,
      error: firstError ?? "Invalid shipment data",
    };
  }

  return await updateShipment(shipmentId, {
    carrier_name: parsed.data.carrier_name,
    tracking_number: parsed.data.tracking_number,
  });
}
