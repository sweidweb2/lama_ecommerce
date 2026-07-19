"use server";

import { findOrderSchema } from "@/lib/validators/order/find";
import { requestOrderAccessLinkService } from "@/services/order_access.service";
import {
  checkFormRateLimit,
  getClientIpFromHeaders,
  ORDER_LOOKUP_RATE_LIMIT,
} from "@/lib/rate-limit";

const GENERIC_SUCCESS =
  "If we found a matching order, we sent a link to that email.";

/**
 * Public find-order: email + short order id → signed access link email.
 * Always returns the same success message when rate limit allows (anti-enumeration).
 */
export async function requestOrderAccessLinkAction(input: {
  email: string;
  shortOrderId: string;
}) {
  const ip = await getClientIpFromHeaders();
  const emailKey = input.email?.trim().toLowerCase() || "unknown";
  const allowed = await checkFormRateLimit({
    key: `order-lookup:${ip}:${emailKey}`,
    limit: ORDER_LOOKUP_RATE_LIMIT.limit,
    windowSeconds: ORDER_LOOKUP_RATE_LIMIT.windowSeconds,
  });

  if (!allowed) {
    return {
      success: false as const,
      error: "Too many requests. Try again later.",
    };
  }

  const parsed = findOrderSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error:
        parsed.error.issues[0]?.message ??
        "Invalid email or order code.",
    };
  }

  const result = await requestOrderAccessLinkService(parsed.data);
  if (!result.success) {
    return {
      success: false as const,
      error: result.error ?? "Unable to process request. Please try again.",
    };
  }

  return { success: true as const, message: GENERIC_SUCCESS };
}
