import type { ListReviewsForAdminParams } from "@/repositories/review.repository";

export const ADMIN_REVIEWS_PAGE_SIZE = 20;

export type { ListReviewsForAdminParams };

export interface AdminReviewsListSearchParams {
  page?: string;
  status?: string;
  rating?: string;
  q?: string;
}

const VALID_STATUS = new Set(["pending", "approved", "rejected"]);

/**
 * Parse admin reviews list searchParams into repo list params.
 */
export function parseAdminReviewsListParams(
  params: AdminReviewsListSearchParams,
  pageSize: number = ADMIN_REVIEWS_PAGE_SIZE,
): ListReviewsForAdminParams {
  const statusRaw = (params.status ?? "").trim();
  const status =
    statusRaw && VALID_STATUS.has(statusRaw)
      ? (statusRaw as ListReviewsForAdminParams["status"])
      : null;

  const ratingNum = Number(params.rating);
  const rating =
    params.rating &&
    Number.isInteger(ratingNum) &&
    ratingNum >= 1 &&
    ratingNum <= 5
      ? ratingNum
      : null;

  return {
    page: Math.max(1, Number(params.page) || 1),
    pageSize: Math.min(Math.max(1, pageSize), 100),
    status,
    rating,
    productQuery: params.q?.trim() || null,
  };
}
