import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Shipment } from "@/types/order";

export interface CreateShipmentPayload {
  order_id: string;
  carrier_name: string;
  tracking_number: string;
}

/**
 * Insert a shipment row for an order (admin fulfillment).
 * Uses admin client — shipments have no user-facing write RLS.
 */
export async function createShipment(
  payload: CreateShipmentPayload,
): Promise<{ success: boolean; error?: string; data?: Shipment }> {
  try {
    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from("shipments")
      .insert({
        order_id: payload.order_id,
        carrier_name: payload.carrier_name.trim(),
        tracking_number: payload.tracking_number.trim(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating shipment:", error);
      return {
        success: false,
        error: error.message || "Failed to create shipment",
      };
    }

    return { success: true, data: data as Shipment };
  } catch (error) {
    console.error("Unexpected error in createShipment:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unexpected error creating shipment",
    };
  }
}
