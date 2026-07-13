"use server";

import { revalidatePath } from "next/cache";
import { getCurrentAuthUserFromAction } from "@/repositories/auth.repository";
import { checkoutService } from "@/services/checkout.service";
import { checkoutSchema, type CheckoutInput } from "@/lib/validators/checkout/checkout";
import { getGuestSessionId } from "@/lib/auth/guest-session";

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
): Promise<{ success: boolean; error?: string; orderId?: string }> {
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
  const result = await checkoutService({
    cart_id: input.cart_id,
    user_id: user?.id ?? null,
    session_id: sessionId,
    shipping_zone_id: input.shipping_zone_id,
    address: input.address,
    phone: input.phone,
    email: input.email,
    promo_code: input.promo_code ?? null,
    save_address: Boolean(user && input.save_address),
  });

  // 4. Revalidate on success
  if (result.success) {
    revalidatePath("/cart");
    revalidatePath("/orders");
    if (input.save_address && user) {
      revalidatePath("/account");
    }
  }

  return result;
}
