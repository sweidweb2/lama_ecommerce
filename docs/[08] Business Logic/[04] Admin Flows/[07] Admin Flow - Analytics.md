# Admin Flow — Analytics

**Scope:** Admin Analytics from `flow.md`: `/admin/analytics` KPI cards + charts (sales, users, order/payment status, top products).  
**Out of scope:** Dashboard layout (sibling doc); Catalog product-views module.

**Verdict:** Happy path **works** — **real DB queries** (service-role), not mock charts; empty states exist. Same correctness debt as Dashboard: **“active carts” = all carts**, **revenue/orders include cancelled**, **~1000-row silent under-count**, **auth/errors → zeros**. Extra: **“Active products” label is false** (counts all products). No date-range UI; metrics **diverge from Dashboard**.

---

## Happy path (what works today)

1. `/admin/analytics` → middleware → `Promise.all` of analytics services → each `requireAdmin` → `analytics.repository` via **service role**.
2. `AnalyticsStats`: users (active), products (all — mislabeled), orders, revenue, carts, AOV, pending reviews, low-stock (≤5), optional pending contact.
3. Charts: sales+orders by month (last ~6 mo), user growth (active, last ~6 mo), order/payment status pies (all-time), top products by revenue (limit 10).
4. Empty chart panels show “No … data available”; top-products block omitted when empty.

```text
/admin/analytics
  → get*Service → requireAdmin → analytics.repository (createSupabaseAdminClient)
  → AnalyticsStats + AnalyticsCharts (Recharts)
```

All series/stats come from live tables (`orders`, `profiles`, `products`, `carts`, `reviews`, `contact_us`, `customised_products`, `order_items`) — **not** hardcoded demo arrays.

---

## P0 — Correctness (fix first)

- [ ] **“Active carts” = every cart row**  
  Same as Dashboard.  
  **Where:** `repositories/analytics.repository.ts` (`getAnalyticsStats`); `AnalyticsStats.tsx`.  
  **Do:** Filter or relabel “Total carts”.

- [ ] **Revenue / order count / AOV / monthly sales include cancelled**  
  No status / `payment_status` filter on aggregates. Top products do **not** exclude cancelled (Dashboard top sellers do).  
  **Where:** `getSalesAndOrdersByMonth`, `getAnalyticsStats`, `getTopProductsByRevenue`.  
  **Do:** Shared business filters aligned with Sales/Dashboard.

- [ ] **Aggregations risk silent under-count (~1000-row PostgREST cap)**  
  Status pies, revenue reduce, monthly grouping, order_items for top products — unbounded row arrays.  
  **Where:** `repositories/analytics.repository.ts`.  
  **Do:** `count: exact` / SQL-RPC aggregates.

- [ ] **Failures look like an empty business**  
  Services/repos catch → zeros/`[]`. No error UI on page. Missing SR key → zeros.  
  **Where:** `services/analytics.service.ts`; `repositories/analytics.repository.ts`; `app/admin/analytics/page.tsx`.  
  **Do:** `ok: false` envelope + error banner (same as Dashboard P0).

- [ ] **“Total Products” labeled “Active products” but counts all rows**  
  No `is_active` filter; Dashboard products KPI filters active.  
  **Where:** `getAnalyticsStats`; `AnalyticsStats.tsx`.  
  **Do:** `.eq("is_active", true)` or fix label to “All products”.

---

## P1 — Incomplete / wrong analytics behavior

- [ ] **No date-range controls**  
  Sales/user growth: rolling ~6 months (server TZ). Stats/pies/top: all-time. No picker, compare, or TZ note.  
  **Where:** `app/admin/analytics/page.tsx`; repository date math.  
  **Do:** Query params + shared range with Dashboard.

- [ ] **Metric definitions diverge from Dashboard**  

  | Metric | Dashboard | Analytics |
  |--------|-----------|-----------|
  | Products | `is_active` | all (mislabeled Active) |
  | Low stock | variants `1–10` | products with any variant `≤5` (incl. 0) |
  | Revenue window | calendar month | all-time (stats) / 6 mo (chart) |
  | Contact pending | `status = new` | `new` + `read` |
  | Top products | excludes cancelled | includes cancelled |
  | Carts | all as “active” | same |

  **Do:** Shared metric helpers + identical labels.

- [ ] **Month buckets can skip empty months; fragile date sort**  
  **Where:** `getSalesAndOrdersByMonth`, `getUserGrowthByMonth`.  
  **Do:** Fixed `YYYY-MM` keys + zero-fill.

- [ ] **Top products keyed by name snapshot** (`product_id` = name string)  
  Renames/duplicates merge wrong.  
  **Where:** `getTopProductsByRevenue`.  
  **Do:** Aggregate by real `product_id` if available on `order_items`.

- [x] ✅ **`is_active` ignored for `/admin`** done✅ — shared auth P0 fixed (middleware + `requireAdmin`).

---

## P2 — DX / UX

- [ ] Stats always show `0` with no error vs empty distinction  
- [ ] Top products: section hidden when empty (no message)  
- [ ] Pending Contact card only if `> 0` (inconsistent)  
- [ ] No deep links from KPI tiles to related admin modules  
- [ ] Generic Recharts styling  

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
| Cancelled / refunded | Inflate revenue/AOV/charts/top (P0) |
| Many carts | Mislabeled “active” (P0) |
| Inactive products | Counted as “Active” (P0) |
| Missing SR key | Zeros / empty (P0) |
| Non-admin `/admin/analytics` | Middleware redirect |
| Inactive admin | Still allowed |
| No sales in last 6 months | Empty sales chart |
| Top products empty | Section omitted |

---

## Key file map

| Concern | Path |
|---------|------|
| Page | `app/admin/analytics/page.tsx` |
| UI | `components/admin/analytics/AnalyticsStats.tsx`, `AnalyticsCharts.tsx` |
| Service | `services/analytics.service.ts` |
| DB | `repositories/analytics.repository.ts` |
| Auth / SR | `lib/auth/require-admin.ts`, `lib/supabase/admin.ts` |
| Related | `repositories/dashboard.repository.ts`, `[02] Admin Flow - Dashboard.md` |

---

## Related docs

- Index: `flow.md` (Admin → Analytics)
- Shared metric debt: `[02] Admin Flow - Dashboard.md`
- Sales revenue filters: `[04] Admin Flow - Sales.md`

**Highest-impact fixes:** shared revenue/cart/product definitions with Dashboard → RPC/exact aggregates → surface errors → fix Active products label/filter.
