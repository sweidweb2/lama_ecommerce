import { headers } from "next/headers";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export interface CheckFormRateLimitOptions {
  key: string;
  limit: number;
  windowSeconds: number;
}

/**
 * DB-backed sliding window rate limit using form_rate_limits (service role).
 * Returns true if the request is allowed, false if the limit was exceeded.
 */
export async function checkFormRateLimit(
  options: CheckFormRateLimitOptions,
): Promise<boolean> {
  const { key, limit, windowSeconds } = options;
  const supabase = createSupabaseAdminClient();
  const now = Date.now();

  try {
    const { data: row, error } = await (supabase as any)
      .from("form_rate_limits")
      .select("key, window_started_at, hit_count")
      .eq("key", key)
      .maybeSingle();

    if (error) {
      console.error("Failed to read form_rate_limits:", error);
      // Fail open for availability of contact/lead forms if the table is missing
      return true;
    }

    const windowStartedAt = row?.window_started_at
      ? new Date(row.window_started_at).getTime()
      : 0;
    const windowExpired =
      !row || now - windowStartedAt >= windowSeconds * 1000;

    if (windowExpired) {
      const { error: upsertError } = await (supabase as any)
        .from("form_rate_limits")
        .upsert({
          key,
          window_started_at: new Date(now).toISOString(),
          hit_count: 1,
        });

      if (upsertError) {
        console.error("Failed to reset form_rate_limits:", upsertError);
      }
      return true;
    }

    if ((row.hit_count as number) >= limit) {
      return false;
    }

    const { error: updateError } = await (supabase as any)
      .from("form_rate_limits")
      .update({ hit_count: (row.hit_count as number) + 1 })
      .eq("key", key);

    if (updateError) {
      console.error("Failed to increment form_rate_limits:", updateError);
    }

    return true;
  } catch (err) {
    console.error("Unexpected error in checkFormRateLimit:", err);
    return true;
  }
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
