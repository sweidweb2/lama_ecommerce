import {
  getCurrentAuthUserFromAction,
  getCurrentAuthUserFromComponent,
} from "@/repositories/auth.repository";
import {
  getGuestSessionId,
  getOrCreateGuestSessionId,
} from "@/lib/auth/guest-session";
import type { StorefrontOwner } from "@/types/storefront-owner";
import { isUserOwner } from "@/types/storefront-owner";

/**
 * Storefront identity resolved once per request (auth layer).
 * Same shape as StorefrontOwner — repos should prefer that type.
 */
export type SessionContext = StorefrontOwner;

export const isUserSession = isUserOwner;

type ResolveStorefrontSessionOptions = {
  /** Mint/set guest_session_id when unauthenticated and cookie missing (ATC, wishlist toggle). */
  createGuestIfMissing?: boolean;
};

async function resolveFromAuthUser(
  userId: string | undefined,
  options: ResolveStorefrontSessionOptions,
): Promise<SessionContext | null> {
  if (userId) {
    return { kind: "user", userId };
  }

  if (options.createGuestIfMissing) {
    return { kind: "guest", sessionId: await getOrCreateGuestSessionId() };
  }

  const sessionId = await getGuestSessionId();
  return sessionId ? { kind: "guest", sessionId } : null;
}

/**
 * Resolve storefront identity for Server Actions / Route Handlers.
 * Uses the action Supabase client (may write cookies).
 */
export async function resolveStorefrontSession(
  options: ResolveStorefrontSessionOptions = {},
): Promise<SessionContext | null> {
  const user = await getCurrentAuthUserFromAction();
  return resolveFromAuthUser(user?.id, options);
}

/**
 * Resolve storefront identity for Server Components.
 * Uses the component Supabase client (read-only cookies).
 * Never pass createGuestIfMissing — SC cannot mint cookies safely here.
 */
export async function resolveStorefrontSessionForComponent(): Promise<SessionContext | null> {
  const user = await getCurrentAuthUserFromComponent();
  return resolveFromAuthUser(user?.id, { createGuestIfMissing: false });
}
