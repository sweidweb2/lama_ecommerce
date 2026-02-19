import {
  processCheckout,
  type ProcessCheckoutInput,
} from "@/repositories/order.repository";
import { getAllShippingZonesWithFee } from "@/repositories/shipping_zone.repository";
import { incrementPurchaseCountForOrderService } from "@/services/product_view.service";
import type { AddressSnapshot } from "@/types/order";

/**
 * Input coming from the checkout action after validation.
 */
export interface CheckoutServiceInput {
  cart_id: string;
  user_id: string | null;
  session_id: string | null;
  shipping_zone_id: string;
  address: AddressSnapshot;
  phone: string;
  email: string;
}

/**
 * Orchestrate the checkout flow:
 * 1. Look up the shipping fee from the zone (server-side, never trust client).
 * 2. Delegate to the atomic process_checkout PG function.
 * 3. Return the new order ID on success.
 */
export async function checkoutService(
  input: CheckoutServiceInput,
): Promise<{ success: boolean; error?: string; orderId?: string }> {
  try {
    // 1. Resolve shipping fee from zone_id (server-calculated)
    const zones = await getAllShippingZonesWithFee();
    const selectedZone = zones.find((z) => z.id === input.shipping_zone_id);

    if (!selectedZone) {
      return { success: false, error: "Invalid shipping zone selected." };
    }

    const shippingFee = selectedZone.fee ?? 0;

    // 2. Build RPC input
    const rpcInput: ProcessCheckoutInput = {
      cart_id: input.cart_id,
      user_id: input.user_id,
      session_id: input.session_id,
      shipping_fee: shippingFee,
      discount: 0, // No promo code support yet
      phone: input.phone,
      email: input.email,
      address_snapshot: input.address,
    };

    // 3. Execute atomic checkout
    const result = await processCheckout(rpcInput);

    // 4. If checkout successful, increment purchase_count for all products in the order
    if (result.success && result.orderId) {
      // Increment purchase_count in the background (fire and forget)
      incrementPurchaseCountForOrderService(result.orderId).catch((error: unknown) => {
        console.error("Failed to increment purchase_count:", error);
        // Don't fail the checkout if stats update fails
      });
    }

    return result;
  } catch (error) {
    console.error("Error in checkoutService:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Checkout failed unexpectedly.",
    };
  }
}
