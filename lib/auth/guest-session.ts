import { cookies } from "next/headers";

/** Cookie name for guest session identification. */
export const GUEST_SESSION_COOKIE = "guest_session_id";

/** Guest session cookie lifetime: 14 days in seconds. */
export const GUEST_SESSION_MAX_AGE = 14 * 24 * 60 * 60;

/** UUID format (any version) — rejects weak/legacy planted cookie values. */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidGuestSessionId(value: string): boolean {
  return UUID_RE.test(value);
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
