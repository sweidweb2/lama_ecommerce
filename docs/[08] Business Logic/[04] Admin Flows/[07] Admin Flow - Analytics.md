# Admin Flow — Analytics

**Scope:** Admin Analytics from `flow.md`: `/admin/analytics` KPI cards + charts (sales, users, order/payment status, top products).  
**Out of scope:** Dashboard layout (sibling doc); Catalog product-views module.

**Verdict:** Happy path **works** — **real DB queries** (service-role), exact aggregates / RPC (no ~1000-row dumps for KPIs/charts), cancelled excluded from revenue KPIs, empty states + error banner. Remaining debt: top-product id keyed by name snapshot.

---

## Happy path (what works today)

1. `/admin/analytics` → middleware → `Promise.all` of analytics services → each `requireAdmin` → `AnalyticsResult` → `analytics.repository` via **service role**.
2. `AnalyticsStats`: users, products, orders, revenue, carts, AOV, pending reviews, low-stock, pending contact — KPI tiles deep-link to related admin modules; values show `"—"` on load failure.
3. Charts: sales+orders by month, user growth, order/payment status pies, top products by revenue (limit 10) — themed with `--chart-*` tokens.
4. Empty chart panels (including top products) show “No … data available”; auth/load failures show a page error banner.

```text
/admin/analytics
  → get*Service → requireAdmin → analytics.repository (createSupabaseAdminClient)
  → AnalyticsStats + AnalyticsCharts (Recharts)
```

All series/stats come from live tables (`orders`, `profiles`, `products`, `carts`, `reviews`, `contact_us`, `customised_products`, `order_items`) — **not** hardcoded demo arrays.

---

## P0 — Correctness (fix first)

- [x] ✅ **“Active carts” = every cart row** done✅  
  Aligned with Dashboard: `cart_items!inner` + exact head count.  
  **Where:** `repositories/analytics.repository.ts` (`getAnalyticsStats`); `AnalyticsStats.tsx`.  
  **Done:** Count only carts with ≥1 item; keep “Active Carts” label.

- [x] ✅ **Revenue / order count / AOV / monthly sales include cancelled** done✅  
  Shared `REVENUE_EXCLUDED_STATUSES` (`cancelled` only — same as Dashboard; no `payment_status` filter on revenue KPIs).  
  **Where:** `getSalesAndOrdersByMonth`, `getAnalyticsStats`, `getTopProductsByRevenue`.  
  **Done:** Filter via `applyRevenueStatusFilter`; exact count/sum/RPC so filters apply at full scale.

- [x] ✅ **Aggregations risk silent under-count (~1000-row PostgREST cap)** done✅  
  Status pies, revenue reduce, monthly grouping, order_items for top products — unbounded row arrays.  
  **Where:** `repositories/analytics.repository.ts`.  
  **Done:** Exact `count` / `total.sum()` for stats + per-month series; exact per-enum pies; `admin_top_products_by_revenue` RPC (`20260720194000_admin_analytics_top_products.sql`).

- [x] ✅ **Failures look like an empty business** done✅  
  Services/repos catch → zeros/`[]`. No error UI on page. Missing SR key → zeros.  
  **Where:** `services/analytics.service.ts`; `repositories/analytics.repository.ts`; `app/admin/analytics/page.tsx`.  
  **Do:** `ok: false` envelope + error banner (same as Dashboard P0).  
  **Done:** Repo throws on query/SR errors; `AnalyticsResult` + `withAdminResult` on all six loaders; page banner + Reload; stats `"—"` when `ok: false`; charts distinguish error vs empty.

- [x] ✅ **“Total Products” labeled “Active products” but counts all rows** done✅  
  No `is_active` filter; Dashboard products KPI filters active.  
  **Where:** `getAnalyticsStats`; `AnalyticsStats.tsx`.  
  **Do:** `.eq("is_active", true)` or fix label to “All products”.  
  **Done:** `.eq("is_active", true)` + shared `METRIC_LABELS.activeProducts` (Dashboard P1 shared metrics).

---

## P1 — Incomplete / wrong analytics behavior

- [x] ✅ **No date-range controls** done✅  
  Sales/user growth: rolling ~6 months (server TZ). Stats/pies/top: all-time. No picker, compare, or TZ note.  
  **Where:** `app/admin/analytics/page.tsx`; repository date math.  
  **Do:** Query params + shared range with Dashboard.  
  **Done:** Shared `parseAdminDateRange` + `AdminDateRangeControls`; default all-time; bounded range filters stats/charts/top products. Landed with Dashboard P1.

- [x] ✅ **Metric definitions diverge from Dashboard** done✅  

  | Metric | Dashboard | Analytics |
  |--------|-----------|-----------|
  | Products | `is_active` | all (mislabeled Active) |
  | Low stock | variants `1–10` | products with any variant `≤5` (incl. 0) |
  | Revenue window | calendar month | all-time (stats) / 6 mo (chart) |
  | Contact pending | `status = new` | `new` + `read` |
  | Top products | excludes cancelled | includes cancelled |
  | Carts | all as “active” | same |

  **Do:** Shared metric helpers + identical labels.  
  **Done:** `lib/admin/metric-definitions.ts` — both use `is_active` products, variant low stock `1–10`, total carts, cancelled-excluded revenue/top products. Contact pending still differs (`new` vs `new`+`read`) by design for inbox vs analytics. Revenue window still differs by page default (month vs all-time) but shares the same query helpers when a range is set.

- [x] ✅ **Month buckets can skip empty months; fragile date sort** done✅  
  **Where:** `getSalesAndOrdersByMonth`, `getUserGrowthByMonth`.  
  **Done:** Fixed UTC `YYYY-MM` keys via `listUtcMonthKeysForRange` + per-month exact queries (zero-filled).

- [x] ✅ **Top products keyed by name snapshot** (`product_id` = name string) done✅  
  Renames/duplicates merge wrong.  
  **Where:** `getTopProductsByRevenue`.  
  **Do:** Aggregate by real `product_id` if available on `order_items`.  
  **Done:** RPC `admin_top_products_by_revenue` groups via `customised_products.product_id` (orphan fallback); Dashboard `getTopSellingProducts` aligned.

- [x] ✅ **`is_active` ignored for `/admin`** done✅ — shared auth P0 fixed (middleware + `requireAdmin`).

---

## P2 — DX / UX

- [x] ✅ **Stats always show `0` with no error vs empty distinction** done✅ — `AnalyticsResult` + `"—"` when failed  
- [x] ✅ **Top products: section hidden when empty** done✅ — always shown with empty copy  
- [x] ✅ **Pending Contact card only if `> 0`** done✅ — always shown with other KPIs  
- [x] ✅ **No deep links from KPI tiles** done✅ — `StatCard` optional `href` wired to admin modules  
- [x] ✅ **Generic Recharts styling** done✅ — `--chart-*` / border / muted axis ticks  

---

## Deferred / works-as-implemented

| Behavior | Why OK |
|----------|--------|
| Real DB-backed charts (not mock) | Service-role repo |
| Auth: middleware + `requireAdmin` + SR | Same admin pattern |
| Chart empty copy when arrays empty | `AnalyticsCharts.tsx` |
| Finance ledger / cohorts / funnels | Out of scope |
| Analytics unit tests | Deferred |

---

## Edge-case matrix

| Edge case | Status |
|-----------|--------|
| Empty DB | Charts empty copy; stats 0 |
| Large order history | Silent under-count (P0) |
| Auth / load failure | Error banner; stats `"—"` |
| Missing SR key / Unauthorized | `AnalyticsResult` `ok: false` |
| Non-admin `/admin/analytics` | Middleware redirect |
| No sales in range | Empty sales chart |
| Top products empty | Section + empty copy |
| KPI tile click | Deep link to related admin module |

---

## Key file map

| Concern | Path |
|---------|------|
| Page | `app/admin/analytics/page.tsx` |
| UI | `components/admin/analytics/AnalyticsStats.tsx`, `AnalyticsCharts.tsx` |
| Service | `services/analytics.service.ts` |
| DB | `repositories/analytics.repository.ts` |
| Top products RPC | `supabase/migrations/20260720194000_admin_analytics_top_products.sql` |
| Auth / SR | `lib/auth/require-admin.ts`, `lib/supabase/admin.ts` |
| Related | `repositories/dashboard.repository.ts`, `[02] Admin Flow - Dashboard.md` |

---

## Related docs

- Index: `flow.md` (Admin → Analytics)
- Shared metric debt: `[02] Admin Flow - Dashboard.md`
- Sales revenue filters: `[04] Admin Flow - Sales.md`

**Highest-impact remaining:** top products keyed by name snapshot (P1).
