import type { AdminProductViewRow } from "@/repositories/product_view.repository";

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-US").format(num);
}

/** Compact locale-aware date/time (used by the global product views table). */
export function formatViewedAtShort(dateString: string): string {
  try {
    return new Date(dateString).toLocaleString(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return dateString;
  }
}

/** Verbose en-US date/time (used by the per-product views table). */
export function formatViewedAtLong(dateString: string): string {
  try {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
}

export type ViewerTypeFilter = "all" | "user" | "guest" | string;

/** Shared viewer-type predicate ("user" = logged in, "guest" = anonymous). */
export function matchesViewerType(
  view: Pick<AdminProductViewRow, "user_id">,
  viewerType: ViewerTypeFilter,
): boolean {
  if (viewerType === "user") return view.user_id !== null && !!view.user_id;
  if (viewerType === "guest") return !view.user_id;
  return true;
}
