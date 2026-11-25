import { requireAdmin } from "@/lib/auth/require-admin";
import { getCartByIdForAdmin } from "@/repositories/cart.repository";
import {
  processCheckout,
  type ProcessCheckoutInput,
} from "@/repositories/order.repository";
import {
  createAddressForUser,
  getAddressesByUserId,
  updateAddressForUser,
} from "@/services/address.service";
import { getShippingZoneById } from "@/services/shipping_zone.service";
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
  /** create = insert (default); update = edit selected saved address. */
  save_address_mode?: "create" | "update";
  /** Required when save_address_mode is update. */
  saved_address_id?: string;
  /** Optional promo code; validated and applied inside process_checkout. */
  promo_code?: string | null;
}

export type CheckoutServiceResult = {
  success: boolean;
  error?: string;
  orderId?: string;
  /** Present only when save_address was requested; true if address book write succeeded. */
  addressSaved?: boolean;
};

/**
 * Orchestrate the checkout flow:
 * 1. Validate shipping zone exists (friendly early error).
 * 2. Delegate to process_checkout — fee + zone name resolved in SQL from zone id.
 * 3. Optionally save address to the user's address book.
 * 4. Return the new order ID on success.
 */
export async function checkoutService(
  input: CheckoutServiceInput,
): Promise<CheckoutServiceResult> {
  try {
    if (input.user_id) {
      const shopBlock = await getAdminShopBlockForUserId(input.user_id);
      if (shopBlock) {
        return { success: false, error: shopBlock };
      }
    }

    // 1. Cheap zone existence check (RPC is source of truth for fee + zone snapshot)
    const selectedZone = await getShippingZoneById(input.shipping_zone_id);

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

    // 4. Post-checkout side effects (order success is independent of these)
    let addressSaved: boolean | undefined;

    if (result.success && result.orderId) {
      incrementPurchaseCountForOrderService(result.orderId).catch((error: unknown) => {
        console.error("Failed to increment purchase_count:", error);
      });

      sendOrderConfirmationEmailService(result.orderId).catch((error: unknown) => {
        console.error("Failed to send order confirmation email:", error);
      });

      if (input.save_address && input.user_id) {
        try {
          const addressFields = {
            country: input.address.country,
            city: input.address.city,
            address: input.address.address,
            postal_code: input.address.postal_code ?? null,
            phone: input.phone,
          };

          if (
            input.save_address_mode === "update" &&
            input.saved_address_id
          ) {
            const updated = await updateAddressForUser(
              input.user_id,
              input.saved_address_id,
              addressFields,
            );
            addressSaved = updated != null;
            if (!updated) {
              console.error(
                "Failed to update address after checkout: not found or invalid",
              );
            }
          } else {
            const existingAddresses = await getAddressesByUserId(input.user_id);
            const saveResult = await createAddressForUser(input.user_id, {
              ...addressFields,
              is_default: existingAddresses.length === 0,
            });
            addressSaved = saveResult.ok;
            if (!saveResult.ok) {
              console.error(
                "Failed to save address after checkout:",
                saveResult.error,
              );
            }
          }
        } catch (error: unknown) {
          addressSaved = false;
          console.error("Failed to save address after checkout:", error);
        }
      }
    }

    return addressSaved === undefined ? result : { ...result, addressSaved };
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
): Promise<CheckoutServiceResult> {
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
