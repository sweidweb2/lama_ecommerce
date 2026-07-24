"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getGuestSessionId } from "@/lib/auth/guest-session";
import { getAdminShopBlockForCurrentUser } from "@/lib/auth/require-customer-shop";
import { getCurrentAuthUserFromAction } from "@/repositories/auth.repository";
import {
  checkoutForAdminService,
  checkoutService,
} from "@/services/checkout.service";
import { checkoutSchema, type CheckoutInput } from "@/lib/validators/checkout/checkout";

/**
 * Server action: process checkout.
 *
 * Flow:
 * 1. Determine if user is authenticated or guest.
 * 2. Validate input with Zod.
 * 3. Delegate to checkoutService (which looks up shipping fee server-side
 *    and calls the atomic PG function).
 * 4. On success, revalidate relevant paths.
 * 5. Return order ID for client-side redirect handling.
 */
export async function checkoutAction(
  raw: CheckoutInput,
): Promise<{
  success: boolean;
  error?: string;
  orderId?: string;
  addressSaved?: boolean;
}> {
  const shopBlock = await getAdminShopBlockForCurrentUser();
  if (shopBlock) {
    return { success: false, error: shopBlock };
  }

  // 1. Validate input
  const parsed = checkoutSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const firstKey = Object.keys(fieldErrors)[0] as keyof typeof fieldErrors | undefined;
    const firstError = firstKey ? fieldErrors[firstKey]?.[0] : undefined;
    return { success: false, error: firstError ?? "Invalid checkout data" };
  }

  const input = parsed.data;

  // 2. Determine user / guest identity
  const user = await getCurrentAuthUserFromAction();
  let sessionId: string | null = null;

  if (!user) {
    sessionId = await getGuestSessionId();

    if (!sessionId) {
      return {
        success: false,
        error: "No active session found. Please add items to your cart first.",
      };
    }
  }

  // 3. Run checkout
  const shouldSaveAddress = Boolean(user && input.save_address);
  const result = await checkoutService({
    cart_id: input.cart_id,
    user_id: user?.id ?? null,
    session_id: sessionId,
    shipping_zone_id: input.shipping_zone_id,
    address: input.address,
    phone: input.phone,
    email: input.email,
    promo_code: input.promo_code ?? null,
    save_address: shouldSaveAddress,
    save_address_mode: shouldSaveAddress
      ? input.save_address_mode
      : undefined,
    saved_address_id:
      shouldSaveAddress && input.save_address_mode === "update"
        ? input.saved_address_id
        : undefined,
  });

  // 4. Revalidate on success
  if (result.success) {
    revalidatePath("/cart");
    revalidatePath("/orders");
    revalidatePath("/order_details");
    if (result.addressSaved) {
      revalidatePath("/account");
    }
  }

  return result;
}

/**
 * Admin server action: checkout any cart as its owner (user_id / session_id from DB).
 */
export async function checkoutForAdminAction(
  raw: CheckoutInput,
): Promise<{ success: boolean; error?: string; orderId?: string }> {
  try {
    await requireAdmin();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = checkoutSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const firstKey = Object.keys(fieldErrors)[0] as
      | keyof typeof fieldErrors
      | undefined;
    const firstError = firstKey ? fieldErrors[firstKey]?.[0] : undefined;
    return { success: false, error: firstError ?? "Invalid checkout data" };
  }

  const input = parsed.data;

  const result = await checkoutForAdminService({
    cart_id: input.cart_id,
    shipping_zone_id: input.shipping_zone_id,
    address: input.address,
    phone: input.phone,
    email: input.email,
    promo_code: input.promo_code ?? null,
  });

  if (result.success) {
    revalidatePath("/admin/carts");
    revalidatePath(`/admin/carts/${input.cart_id}`);
    revalidatePath("/admin/orders");
  }

  return result;
}
