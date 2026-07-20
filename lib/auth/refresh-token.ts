/**
 * Detect stale / revoked refresh-token auth failures from Supabase Auth.
 * Used to clear cookies instead of leaving a broken session in place.
 */
export function isInvalidRefreshTokenError(
  error: { message?: string; code?: string } | null | undefined,
): boolean {
  if (!error) return false;
  const code = (error.code ?? "").toLowerCase();
  if (
    code === "refresh_token_not_found" ||
    code === "invalid_refresh_token" ||
    code.includes("refresh_token")
  ) {
    return true;
  }
  const message = (error.message ?? "").toLowerCase();
  return (
    message.includes("refresh token") || message.includes("refresh_token")
  );
}
