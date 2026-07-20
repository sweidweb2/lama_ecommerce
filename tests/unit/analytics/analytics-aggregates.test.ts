import { describe, expect, it, vi, beforeEach } from "vitest";
import { REVENUE_EXCLUDED_STATUSES } from "@/lib/admin/metric-definitions";

const from = vi.fn();
const rpc = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({ from, rpc }),
}));

function chainable(result: Record<string, unknown> = {}) {
  const api: Record<string, unknown> = {};
  const self = () => api;
  api.select = vi.fn(self);
  api.eq = vi.fn(self);
  api.neq = vi.fn(self);
  api.in = vi.fn(self);
  api.gte = vi.fn(self);
  api.lt = vi.fn(self);
  api.lte = vi.fn(self);
  api.then = undefined;
  Object.assign(api, {
    ...result,
    then: (resolve: (v: unknown) => unknown) =>
      Promise.resolve(result).then(resolve),
  });
  return api;
}

describe("listUtcMonthKeysForRange", () => {
  it("returns 6 UTC months by default including current month", async () => {
    const { listUtcMonthKeysForRange } = await import(
      "@/repositories/analytics.repository"
    );
    const keys = listUtcMonthKeysForRange(undefined, 6);
    expect(keys).toHaveLength(6);
    const now = new Date();
    const current = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
    expect(keys[keys.length - 1]).toBe(current);
  });

  it("zero-fills range months from fromIso to toIsoExclusive", async () => {
    const { listUtcMonthKeysForRange } = await import(
      "@/repositories/analytics.repository"
    );
    const keys = listUtcMonthKeysForRange({
      fromIso: "2026-01-15T00:00:00.000Z",
      toIsoExclusive: "2026-04-01T00:00:00.000Z",
      fromDate: "2026-01-15",
      toDate: "2026-03-31",
      label: "test",
      preset: "custom",
      compareFromIso: null,
      compareToIsoExclusive: null,
    });
    expect(keys).toEqual(["2026-01", "2026-02", "2026-03"]);
  });
});

describe("analytics aggregates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getAnalyticsStats applies cancelled exclude via neq on orders count query", async () => {
    const neq = vi.fn();
    const makeOrdersChain = () => {
      const api = chainable({ count: 2, data: null, error: null });
      api.neq = (...args: unknown[]) => {
        neq(...args);
        return api;
      };
      return api;
    };

    from.mockImplementation((table: string) => {
      if (table === "orders") return makeOrdersChain();
      return chainable({ count: 0, data: null, error: null });
    });
    rpc.mockResolvedValue({ data: 50, error: null });

    const { getAnalyticsStats } = await import(
      "@/repositories/analytics.repository"
    );
    const stats = await getAnalyticsStats();
    expect(stats.totalOrders).toBe(2);
    expect(stats.totalRevenue).toBe(50);
    expect(stats.averageOrderValue).toBe(25);
    expect(rpc).toHaveBeenCalledWith("admin_orders_revenue_sum", {
      p_from: null,
      p_to_exclusive: null,
    });
    for (const status of REVENUE_EXCLUDED_STATUSES) {
      expect(neq).toHaveBeenCalledWith("status", status);
    }
  });

  it("getTopProductsByRevenue calls admin_top_products_by_revenue RPC", async () => {
    rpc.mockResolvedValue({
      data: [
        {
          product_id: "prod-uuid-1",
          product_name: "Tee",
          revenue: 120.5,
          order_count: 3,
        },
      ],
      error: null,
    });
    from.mockImplementation(() => chainable({ count: 0, data: null, error: null }));

    const { getTopProductsByRevenue } = await import(
      "@/repositories/analytics.repository"
    );
    const rows = await getTopProductsByRevenue(5, {
      fromIso: "2026-01-01T00:00:00.000Z",
      toIsoExclusive: "2026-02-01T00:00:00.000Z",
      fromDate: "2026-01-01",
      toDate: "2026-01-31",
      label: "Jan",
      preset: "custom",
      compareFromIso: null,
      compareToIsoExclusive: null,
    });

    expect(rpc).toHaveBeenCalledWith("admin_top_products_by_revenue", {
      p_limit: 5,
      p_from: "2026-01-01T00:00:00.000Z",
      p_to_exclusive: "2026-02-01T00:00:00.000Z",
    });
    expect(rows).toEqual([
      {
        product_id: "prod-uuid-1",
        product_name: "Tee",
        revenue: 120.5,
        orders: 3,
      },
    ]);
  });

  it("getSalesAndOrdersByMonth returns one row per month key without dumping orders", async () => {
    const select = vi.fn();
    from.mockImplementation(() => {
      const api = chainable({ count: 0, data: null, error: null });
      api.select = (...args: unknown[]) => {
        select(...args);
        return api;
      };
      return api;
    });
    rpc.mockResolvedValue({ data: 0, error: null });

    const { getSalesAndOrdersByMonth } = await import(
      "@/repositories/analytics.repository"
    );
    const rows = await getSalesAndOrdersByMonth({
      fromIso: "2026-01-01T00:00:00.000Z",
      toIsoExclusive: "2026-03-01T00:00:00.000Z",
      fromDate: "2026-01-01",
      toDate: "2026-02-28",
      label: "test",
      preset: "custom",
      compareFromIso: null,
      compareToIsoExclusive: null,
    });

    expect(rows.map((r) => r.month)).toEqual(["2026-01", "2026-02"]);
    expect(rows.every((r) => r.orders === 0 && r.sales === 0)).toBe(true);
    // Head count + RPC sum per month — never select full order rows or PostgREST aggregates
    expect(select).toHaveBeenCalledWith("id", { count: "exact", head: true });
    expect(select).not.toHaveBeenCalledWith("total.sum()");
    expect(select).not.toHaveBeenCalledWith("total, created_at, status");
    expect(rpc).toHaveBeenCalledWith("admin_orders_revenue_sum", {
      p_from: "2026-01-01T00:00:00.000Z",
      p_to_exclusive: "2026-02-01T00:00:00.000Z",
    });
  });
});
