"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { updateShipmentForAdminService } from "@/services/shipment.service";

/**
 * Admin-only: update carrier/tracking on an existing shipment.
 */
export async function updateShipmentAction(
  shipmentId: string,
  orderId: string,
  input: { carrier_name: string; tracking_number: string },
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
  } catch {
    return { success: false, error: "Forbidden" };
  }

  const result = await updateShipmentForAdminService(shipmentId, input);

  if (result.success) {
    revalidatePath("/admin/orders");
    revalidatePath("/admin/orders/[id]", "page");
    revalidatePath(`/admin/orders/${orderId}`);
  }

  return { success: result.success, error: result.error };
}
