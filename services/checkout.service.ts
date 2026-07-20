import { requireAdmin } from "@/lib/auth/require-admin";
import { getCartByIdForAdmin } from "@/repositories/cart.repository";
import {
  processCheckout,
  type ProcessCheckoutInput,
} from "@/repositories/order.repository";
import { getAllShippingZonesWithFee } from "@/repositories/shipping_zone.repository";
import { createAddressForUser } from "@/services/address.service";
import { sendOrderConfirmationEmailService } from "@/services/order_email.service";
import { incrementPurchaseCountForOrderService } from "@/services/product_view.service";
import { getAdminShopBlockForUserId } from "@/services/profile.service";
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
  /** Persist submitted address to user_addresses after a successful order. */
  save_address?: boolean;
  /** Optional promo code; validated and applied inside process_checkout. */
  promo_code?: string | null;
}

/**
 * Orchestrate the checkout flow:
 * 1. Validate shipping zone exists (friendly early error).
 * 2. Delegate to process_checkout — fee + zone name resolved in SQL from zone id.
 * 3. Optionally save address to the user's address book.
 * 4. Return the new order ID on success.
 */
export async function checkoutService(
  input: CheckoutServiceInput,
): Promise<{ success: boolean; error?: string; orderId?: string }> {
  try {
    if (input.user_id) {
      const shopBlock = await getAdminShopBlockForUserId(input.user_id);
      if (shopBlock) {
        return { success: false, error: shopBlock };
      }
    }

    // 1. Cheap zone existence check (RPC is source of truth for fee + zone snapshot)
    const zones = await getAllShippingZonesWithFee();
    const selectedZone = zones.find((z) => z.id === input.shipping_zone_id);

    if (!selectedZone) {
      return { success: false, error: "Invalid shipping zone selected." };
    }

    // 2. Build RPC input — pass zone id; SQL resolves fee, persists zone id/name
    const rpcInput: ProcessCheckoutInput = {
      cart_id: input.cart_id,
      user_id: input.user_id,
      session_id: input.session_id,
      shipping_zone_id: input.shipping_zone_id,
      phone: input.phone,
      email: input.email,
      address_snapshot: input.address,
      promo_code: input.promo_code ?? null,
    };

    // 3. Execute atomic checkout
    const result = await processCheckout(rpcInput);

    // 4. Post-checkout side effects (non-blocking for order success)
    if (result.success && result.orderId) {
      incrementPurchaseCountForOrderService(result.orderId).catch((error: unknown) => {
        console.error("Failed to increment purchase_count:", error);
      });

      sendOrderConfirmationEmailService(result.orderId).catch((error: unknown) => {
        console.error("Failed to send order confirmation email:", error);
      });

      if (input.save_address && input.user_id) {
        createAddressForUser(input.user_id, {
          country: input.address.country,
          city: input.address.city,
          address: input.address.address,
          postal_code: input.address.postal_code ?? null,
          phone: input.phone,
          is_default: false,
        }).catch((error: unknown) => {
          console.error("Failed to save address after checkout:", error);
        });
      }
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

/**
 * Admin checkout: place an order for any cart using that cart's owner identity.
 * Loads cart.user_id / cart.session_id server-side so process_checkout ownership passes.
 */
export async function checkoutForAdminService(
  input: Omit<CheckoutServiceInput, "user_id" | "session_id" | "save_address">,
): Promise<{ success: boolean; error?: string; orderId?: string }> {
  try {
    await requireAdmin();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  const cartResult = await getCartByIdForAdmin(input.cart_id);
  if (!cartResult.success || !cartResult.data) {
    return { success: false, error: cartResult.error || "Cart not found" };
  }

  const cart = cartResult.data;
  if (!cart.user_id && !cart.session_id) {
    return { success: false, error: "Cart has no owner" };
  }

  return checkoutService({
    cart_id: input.cart_id,
    user_id: cart.user_id,
    session_id: cart.session_id,
    shipping_zone_id: input.shipping_zone_id,
    address: input.address,
    phone: input.phone,
    email: input.email,
    promo_code: input.promo_code ?? null,
    save_address: false,
  });
}
