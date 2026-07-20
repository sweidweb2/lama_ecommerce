import {
  adminDateRangeSearchParamsSchema,
  type AdminDateRangeSearchParams,
} from "@/lib/validators/admin/date-range";

export type AdminDateRangePreset = "this_month" | "last_30d" | "custom" | "all";

export interface AdminDateRange {
  /** Inclusive start (UTC midnight), ISO string. Null when preset is `all`. */
  fromIso: string | null;
  /** Exclusive end (UTC midnight after last day), ISO string. Null = open through now / all-time. */
  toIsoExclusive: string | null;
  /** YYYY-MM-DD for UI (empty when all-time). */
  fromDate: string;
  /** YYYY-MM-DD inclusive end for UI (empty when all-time). */
  toDate: string;
  label: string;
  preset: AdminDateRangePreset;
  /** Equal-length period immediately before the primary range (for MoM). */
  compareFromIso: string | null;
  compareToIsoExclusive: string | null;
}

export const ADMIN_REPORTING_TZ_NOTE = "Times in UTC";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Format a UTC date as YYYY-MM-DD. */
export function formatUtcYmd(date: Date): string {
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;
}

/** Parse YYYY-MM-DD as UTC midnight. Returns null if invalid. */
export function parseUtcYmd(ymd: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  const [y, m, d] = ymd.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  if (
    date.getUTCFullYear() !== y ||
    date.getUTCMonth() !== m - 1 ||
    date.getUTCDate() !== d
  ) {
    return null;
  }
  return date;
}

function utcStartOfMonth(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

function addUtcDays(date: Date, days: number): Date {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function formatRangeLabel(fromDate: string, toDate: string): string {
  if (fromDate === toDate) return fromDate;
  return `${fromDate} → ${toDate}`;
}

function buildBoundedRange(
  from: Date,
  toExclusive: Date,
  preset: AdminDateRangePreset,
  label: string,
): AdminDateRange {
  const durationMs = toExclusive.getTime() - from.getTime();
  const compareToIsoExclusive = from.toISOString();
  const compareFrom = new Date(from.getTime() - durationMs);
  const fromDate = formatUtcYmd(from);
  const toDate = formatUtcYmd(addUtcDays(toExclusive, -1));

  return {
    fromIso: from.toISOString(),
    toIsoExclusive: toExclusive.toISOString(),
    fromDate,
    toDate,
    label,
    preset,
    compareFromIso: compareFrom.toISOString(),
    compareToIsoExclusive,
  };
}

function thisMonthRange(now = new Date()): AdminDateRange {
  const from = utcStartOfMonth(now);
  const toExclusive = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
  );
  return buildBoundedRange(from, toExclusive, "this_month", "This month (UTC)");
}

function last30dRange(now = new Date()): AdminDateRange {
  const todayStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const toExclusive = addUtcDays(todayStart, 1);
  const from = addUtcDays(todayStart, -29);
  return buildBoundedRange(from, toExclusive, "last_30d", "Last 30 days (UTC)");
}

function allTimeRange(): AdminDateRange {
  return {
    fromIso: null,
    toIsoExclusive: null,
    fromDate: "",
    toDate: "",
    label: "All time",
    preset: "all",
    compareFromIso: null,
    compareToIsoExclusive: null,
  };
}

function customRange(fromYmd: string, toYmd: string): AdminDateRange | null {
  const from = parseUtcYmd(fromYmd);
  const toInclusive = parseUtcYmd(toYmd);
  if (!from || !toInclusive) return null;
  if (toInclusive.getTime() < from.getTime()) return null;
  const toExclusive = addUtcDays(toInclusive, 1);
  return buildBoundedRange(
    from,
    toExclusive,
    "custom",
    formatRangeLabel(fromYmd, toYmd),
  );
}

export type ParseAdminDateRangeOptions = {
  /** Default when no from/to/preset provided. Dashboard: this_month; Analytics: all. */
  defaultPreset?: "this_month" | "last_30d" | "all";
};

function coerceSearchParams(
  input: Record<string, string | string[] | undefined> | URLSearchParams,
): AdminDateRangeSearchParams {
  const raw: Record<string, string | undefined> = {};
  if (input instanceof URLSearchParams) {
    raw.from = input.get("from") ?? undefined;
    raw.to = input.get("to") ?? undefined;
    raw.preset = input.get("preset") ?? undefined;
  } else {
    const from = input.from;
    const to = input.to;
    const preset = input.preset;
    raw.from = Array.isArray(from) ? from[0] : from;
    raw.to = Array.isArray(to) ? to[0] : to;
    raw.preset = Array.isArray(preset) ? preset[0] : preset;
  }
  const parsed = adminDateRangeSearchParamsSchema.safeParse(raw);
  return parsed.success ? parsed.data : {};
}

/**
 * Parse admin date-range query params. Boundaries are UTC midnights.
 */
export function parseAdminDateRange(
  input:
    | Record<string, string | string[] | undefined>
    | URLSearchParams
    | undefined,
  options: ParseAdminDateRangeOptions = {},
): AdminDateRange {
  const defaultPreset = options.defaultPreset ?? "this_month";
  const params = coerceSearchParams(input ?? {});

  if (params.from && params.to) {
    const custom = customRange(params.from, params.to);
    if (custom) return custom;
  }

  if (params.from && !params.to) {
    const custom = customRange(params.from, params.from);
    if (custom) return custom;
  }

  const preset = params.preset ?? defaultPreset;
  if (preset === "last_30d") return last30dRange();
  if (preset === "all") return allTimeRange();
  return thisMonthRange();
}

/** Build query string for admin date-range links (no leading ?). */
export function buildAdminDateRangeQuery(
  range: Pick<AdminDateRange, "fromDate" | "toDate" | "preset">,
): string {
  const params = new URLSearchParams();
  if (range.preset === "all") {
    params.set("preset", "all");
    return params.toString();
  }
  if (range.preset === "this_month" || range.preset === "last_30d") {
    params.set("preset", range.preset);
  }
  if (range.fromDate) params.set("from", range.fromDate);
  if (range.toDate) params.set("to", range.toDate);
  return params.toString();
}

export function adminDateRangeHref(
  path: string,
  range: Pick<AdminDateRange, "fromDate" | "toDate" | "preset">,
): string {
  const q = buildAdminDateRangeQuery(range);
  return q ? `${path}?${q}` : path;
}
