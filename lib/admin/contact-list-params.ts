import type { ContactMessagesFilter } from "@/repositories/contact.repository";

export interface AdminContactListSearchParams {
  name?: string;
  email?: string;
  from?: string;
  to?: string;
}

export interface ParsedAdminContactListParams {
  /** Raw URL values for controlled filter UI inputs. */
  name: string;
  email: string;
  from: string;
  to: string;
  /** Normalized filters for the repository query. */
  filters: ContactMessagesFilter;
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

function startOfDayIso(dateOnly: string): string {
  return new Date(`${dateOnly}T00:00:00.000`).toISOString();
}

function endOfDayIso(dateOnly: string): string {
  return new Date(`${dateOnly}T23:59:59.999`).toISOString();
}

/**
 * Parse admin contact list searchParams into UI initials + repo filters.
 * Date-only `from`/`to` are expanded to local day bounds for timestamptz compares.
 */
export function parseAdminContactListParams(
  params: AdminContactListSearchParams,
): ParsedAdminContactListParams {
  const name = (params.name ?? "").trim();
  const email = (params.email ?? "").trim();
  const from = (params.from ?? "").trim();
  const to = (params.to ?? "").trim();

  const filters: ContactMessagesFilter = {};
  if (name) filters.name = name;
  if (email) filters.email = email;
  if (from && DATE_ONLY.test(from)) {
    filters.from = startOfDayIso(from);
  }
  if (to && DATE_ONLY.test(to)) {
    filters.to = endOfDayIso(to);
  }

  return { name, email, from, to, filters };
}
