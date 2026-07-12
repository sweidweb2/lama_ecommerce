import { ROLES } from "@/lib/constants/roles";
import type { Profile } from "@/types/user";
import { vi } from "vitest";

export const adminProfile = {
  id: "profile-admin",
  user_id: "user-admin",
  full_name: "Admin User",
  role: ROLES.ADMIN,
  created_at: "2026-01-01T00:00:00.000Z",
  is_active: true,
} as Profile;

export const userProfile = {
  id: "profile-user",
  user_id: "user-user",
  full_name: "Normal User",
  role: ROLES.USER,
  created_at: "2026-01-01T00:00:00.000Z",
  is_active: true,
} as Profile;

type RateLimitRow = {
  key: string;
  window_started_at: string;
  hit_count: number;
} | null;

/**
 * Chainable mock for form_rate_limits queries used by checkFormRateLimit.
 */
export function createFormRateLimitClientMock(options: {
  row?: RateLimitRow;
  selectError?: unknown;
}) {
  const upsert = vi.fn().mockResolvedValue({ error: null });
  const updateEq = vi.fn().mockResolvedValue({ error: null });
  const update = vi.fn(() => ({ eq: updateEq }));
  const maybeSingle = vi.fn().mockResolvedValue({
    data: options.row ?? null,
    error: options.selectError ?? null,
  });
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select, upsert, update }));

  return {
    from,
    select,
    eq,
    maybeSingle,
    upsert,
    update,
    updateEq,
  };
}
