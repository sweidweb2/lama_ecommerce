import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export interface CheckFormRateLimitRpcInput {
  key: string;
  limit: number;
  windowSeconds: number;
}

/**
 * Call check_form_rate_limit RPC (service role).
 * Returns success=false when the RPC errors or returns a non-boolean.
 */
export async function checkFormRateLimitRpc(
  input: CheckFormRateLimitRpcInput,
): Promise<{ success: boolean; allowed: boolean; error?: string }> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.rpc("check_form_rate_limit", {
      p_key: input.key,
      p_limit: input.limit,
      p_window_seconds: input.windowSeconds,
    });

    if (error) {
      console.error("Failed to check form_rate_limits:", error);
      return {
        success: false,
        allowed: false,
        error: error.message || "Failed to check form rate limit",
      };
    }

    if (typeof data !== "boolean") {
      console.error("Unexpected check_form_rate_limit response:", data);
      return {
        success: false,
        allowed: false,
        error: "Unexpected rate limit response",
      };
    }

    return { success: true, allowed: data };
  } catch (err) {
    console.error("Unexpected error in checkFormRateLimitRpc:", err);
    return {
      success: false,
      allowed: false,
      error:
        err instanceof Error ? err.message : "Unexpected rate limit error",
    };
  }
}
