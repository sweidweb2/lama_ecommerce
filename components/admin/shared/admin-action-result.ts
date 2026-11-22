export type AdminActionResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Normalizes `{ success: boolean; error?: string }` action results into
 * the strict `AdminActionResult` union.
 */
export function toAdminActionResult(
  result: { success: boolean; error?: string },
  fallbackError: string,
): AdminActionResult {
  if (result.success) return { success: true };
  return { success: false, error: result.error || fallbackError };
}
