import { ROUTES } from "@/lib/constants/routes";

/**
 * Return a safe same-origin relative path for post-auth redirects.
 * Rejects absolute URLs, protocol-relative URLs, backslash tricks, and scheme smuggling.
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
  // Reject control characters (e.g. tab/newline open-redirect tricks)
  if (/[\u0000-\u001F\u007F]/.test(path)) return fallback;

  try {
    const decoded = decodeURIComponent(path);
    if (decoded.startsWith("//") || decoded.includes("\\")) return fallback;
    if (/[\u0000-\u001F\u007F]/.test(decoded)) return fallback;
    // Block schemes smuggled in the path (e.g. /javascript:..., /%2F%2Fevil.com)
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(decoded)) return fallback;
    if (/^(?:\/+)[a-zA-Z][a-zA-Z0-9+.-]*:/.test(decoded)) return fallback;
    if (/(?:^|\/)(?:javascript|data|vbscript):/i.test(decoded)) return fallback;
    // Collapse multiple leading slashes after decode
    if (/^\/{2,}/.test(decoded)) return fallback;
  } catch {
    return fallback;
  }

  return path;
}
