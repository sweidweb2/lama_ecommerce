import { cookies } from "next/headers";
import {
  GUEST_SESSION_COOKIE,
  GUEST_SESSION_MAX_AGE,
  GUEST_SESSION_UUID_RE,
} from "@/lib/auth/guest-session.constants";

export {
  GUEST_SESSION_COOKIE,
  GUEST_SESSION_MAX_AGE,
} from "@/lib/auth/guest-session.constants";

function isValidGuestSessionId(value: string): boolean {
  return GUEST_SESSION_UUID_RE.test(value);
}

/**
 * Read the guest_session_id cookie.
 * Returns the value or null if missing / expired / not a valid UUID.
 */
export async function getGuestSessionId(): Promise<string | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(GUEST_SESSION_COOKIE)?.value ?? null;
  if (!value || !isValidGuestSessionId(value)) {
    return null;
  }
  return value;
}

/**
 * Set (or refresh) the guest_session_id cookie.
 * HttpOnly, Secure (in production), SameSite=Lax, 14-day expiry.
 */
export async function setGuestSessionCookie(sessionId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(GUEST_SESSION_COOKIE, sessionId, {
    httpOnly: true,
    // In development, allow non-secure cookies so local HTTP works.
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: GUEST_SESSION_MAX_AGE,
    path: "/",
  });
}

/**
 * Delete the guest_session_id cookie (e.g. after merging cart on login).
 */
export async function clearGuestSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(GUEST_SESSION_COOKIE);
}

/**
 * Return existing guest session id, or mint a new UUID and set the cookie.
 * Invalid/legacy cookie values are ignored and replaced.
 * Only writes the cookie when creating/replacing — never on reuse
 * (cookie writes from Server Actions soft-refresh the current page).
 * Sliding maxAge on activity happens in middleware via resolveGuestSessionCookie.
 */
export async function getOrCreateGuestSessionId(): Promise<string> {
  const existing = await getGuestSessionId();
  if (existing) {
    return existing;
  }

  const sessionId = crypto.randomUUID();
  await setGuestSessionCookie(sessionId);
  return sessionId;
}
