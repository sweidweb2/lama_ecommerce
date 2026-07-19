/** Cookie name for guest session identification. */
export const GUEST_SESSION_COOKIE = "guest_session_id";

/** Guest session cookie lifetime: 14 days in seconds. */
export const GUEST_SESSION_MAX_AGE = 14 * 24 * 60 * 60;

/** UUID format (any version) — rejects weak/legacy planted cookie values. */
export const GUEST_SESSION_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
