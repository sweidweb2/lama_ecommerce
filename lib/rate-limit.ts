import { headers } from "next/headers";
import { checkFormRateLimitRpc } from "@/repositories/form_rate_limit.repository";

export interface CheckFormRateLimitOptions {
  key: string;
  limit: number;
  windowSeconds: number;
}

/**
 * DB-backed sliding window rate limit using check_form_rate_limit RPC.
 * Returns true if the request is allowed, false if the limit was exceeded
 * or the rate-limit check failed (fail closed).
 */
export async function checkFormRateLimit(
  options: CheckFormRateLimitOptions,
): Promise<boolean> {
  const result = await checkFormRateLimitRpc({
    key: options.key,
    limit: options.limit,
    windowSeconds: options.windowSeconds,
  });

  if (!result.success) {
    return false;
  }

  return result.allowed;
}

/**
 * Resolve client IP from request headers (first x-forwarded-for hop, else x-real-ip).
 */
export async function getClientIpFromHeaders(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = h.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "unknown";
}

export const CONTACT_RATE_LIMIT = { limit: 5, windowSeconds: 15 * 60 } as const;
export const LEAD_RATE_LIMIT = { limit: 10, windowSeconds: 60 * 60 } as const;
export const ORDER_LOOKUP_RATE_LIMIT = {
  limit: 5,
  windowSeconds: 15 * 60,
} as const;
export const PRODUCT_VIEW_RATE_LIMIT = {
  limit: 60,
  windowSeconds: 60,
} as const;

/**
 * Resolve client IP from a Fetch Request (API routes).
 */
export function getClientIpFromRequest(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "unknown";
}
