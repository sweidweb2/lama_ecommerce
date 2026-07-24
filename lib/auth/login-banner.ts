/**
 * Map login URL query params to a user-facing banner message.
 */
export function getLoginAuthBannerMessage(params: {
  reason?: string | null;
  error?: string | null;
}): string | null {
  if (params.reason === "inactive") {
    return "Your account is inactive. Please contact support for help.";
  }
  if (params.reason === "idle") {
    return "Your session expired due to inactivity. Please sign in again.";
  }
  if (params.error === "auth_callback_error") {
    return "Sign-in link failed or expired. Please try signing in again.";
  }
  return null;
}
