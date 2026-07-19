import {
  GUEST_SESSION_MAX_AGE,
  GUEST_SESSION_UUID_RE,
} from "@/lib/auth/guest-session.constants";

export type GuestSessionCookieOptions = {
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  maxAge: number;
  path: "/";
};

export type GuestSessionCookieDecision = {
  /** Cookie value to set (existing UUID slide, or newly minted). */
  value: string;
  /** Whether a new UUID was minted (vs sliding an existing one). */
  minted: boolean;
  options: GuestSessionCookieOptions;
};

/**
 * Decide guest_session_id cookie value + options for middleware.
 * - Valid existing UUID → reuse and slide maxAge (activity refresh).
 * - Missing/invalid → mint a new UUID.
 */
export function resolveGuestSessionCookie(
  existingValue: string | null | undefined,
  opts?: { secure?: boolean; mintId?: () => string },
): GuestSessionCookieDecision {
  const secure = opts?.secure ?? process.env.NODE_ENV === "production";
  const mintId = opts?.mintId ?? (() => crypto.randomUUID());

  const options: GuestSessionCookieOptions = {
    httpOnly: true,
    secure,
    sameSite: "lax",
    maxAge: GUEST_SESSION_MAX_AGE,
    path: "/",
  };

  if (existingValue && GUEST_SESSION_UUID_RE.test(existingValue)) {
    return { value: existingValue, minted: false, options };
  }

  return { value: mintId(), minted: true, options };
}
