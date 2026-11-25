import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  createSupabaseServerActionClient,
  createSupabaseServerComponentClient,
} from "@/lib/supabase/server";
import type { StorefrontOwner } from "@/types/storefront-owner";

export type StorefrontClientContext = "component" | "action";

/**
 * Supabase client for storefront owner reads/writes:
 * - user: session client (RLS) — Server Component for reads, Server Action for writes
 * - guest: service-role client (guest rows are not reachable via anon RLS)
 */
export async function getStorefrontClient(
  owner: StorefrontOwner,
  context: StorefrontClientContext = "component",
) {
  if (owner.kind === "guest") return createSupabaseAdminClient();
  return context === "component"
    ? await createSupabaseServerComponentClient()
    : await createSupabaseServerActionClient();
}

/**
 * Scope a query to its storefront owner:
 * users by `user_id`, guests by `session_id` with `user_id IS NULL`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function scopeQueryToOwner(query: any, owner: StorefrontOwner) {
  return owner.kind === "user"
    ? query.eq("user_id", owner.userId)
    : query.eq("session_id", owner.sessionId).is("user_id", null);
}

/** Ownership columns for inserts (exactly one owner column is set). */
export function ownerInsertColumns(owner: StorefrontOwner): {
  user_id: string | null;
  session_id: string | null;
} {
  return owner.kind === "user"
    ? { user_id: owner.userId, session_id: null }
    : { session_id: owner.sessionId, user_id: null };
}

/** Guest-only filter: session_id match + unclaimed (user_id IS NULL). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function scopeQueryToGuestSession(query: any, sessionId: string) {
  return query.eq("session_id", sessionId).is("user_id", null);
}
