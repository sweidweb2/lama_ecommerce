import { ROUTES } from "@/lib/constants/routes";

/**
 * Return a safe same-origin relative path for post-auth redirects.
 * Rejects absolute URLs, protocol-relative URLs, and backslash tricks.
 */
export function safeRedirectPath(
  candidate: string | null | undefined,
  fallback: string = ROUTES.HOME,
): string {
  if (!candidate) return fallback;

  const path = candidate.trim();
  if (!path.startsWith("/")) return fallback;
  if (path.startsWith("//")) return fallback;
  if (path.includes("\\")) return fallback;
  // Block schemes smuggled after encoding tricks (e.g. /%2F%2Fevil.com)
  try {
    const decoded = decodeURIComponent(path);
    if (decoded.startsWith("//") || /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(decoded)) {
      return fallback;
    }
  } catch {
    return fallback;
  }

  return path;
}
