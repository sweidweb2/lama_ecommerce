import type { ListProfilesForAdminParams } from "@/repositories/profile.repository";
import type { ProfileRole } from "@/types/user";

export const ADMIN_USERS_PAGE_SIZE = 20;

export type { ListProfilesForAdminParams };

export interface AdminUsersListSearchParams {
  page?: string;
  q?: string;
  role?: string;
  status?: string;
}

export function parseAdminUsersListParams(
  params: AdminUsersListSearchParams,
  pageSize: number = ADMIN_USERS_PAGE_SIZE,
): ListProfilesForAdminParams {
  const roleRaw = params.role?.trim().toLowerCase();
  const role: ProfileRole | null =
    roleRaw === "admin" || roleRaw === "user" ? roleRaw : null;

  const statusRaw = params.status?.trim().toLowerCase();
  let isActive: boolean | null = null;
  if (statusRaw === "active") isActive = true;
  else if (statusRaw === "inactive") isActive = false;

  return {
    page: Math.max(1, Number(params.page) || 1),
    pageSize: Math.min(Math.max(1, pageSize), 100),
    query: params.q?.trim() || undefined,
    role,
    isActive,
  };
}
