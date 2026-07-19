# Admin Flow — Dashboard

**Scope:** Admin landing overview at `/admin` — KPI cards, attention tiles, preview lists, deep links into other admin modules.  
**Out of scope:** Full `/admin/analytics` charts (separate `flow.md` Analytics bullet), catalog CRUD, sales ops, customers, engagement, backups. Analytics is noted only where metric definitions collide with the dashboard.

**Verdict:** Happy path **works** — live DB-backed overview (service-role repos + `requireAdmin`), real empty states, and working deep links. Not finance-grade or scale-safe: **“active carts” is all carts**, **month revenue/order totals include cancelled**, PostgREST **~1000-row caps** can silently under-count, and auth/data failures often render as **zeros** instead of errors.

---

## Happy path (what works today)

1. Admin logs in → middleware (`role === admin`) → default lands on `/admin`.
2. `AdminDashboard` (`force-dynamic` layout) runs `Promise.all` of dashboard services → each `requireAdmin()` → `dashboard.repository` via **service-role** client.
3. KPI cards: active users / active products, orders & revenue **this calendar month**, attention counts (pending orders, “in fulfillment”, low/OOS stock, pending reviews, unanswered Q&A, new contacts, leads, carts).
4. Sections: recent orders (encrypted → `/admin/orders/[id]`), status mix bars, top sellers, low-stock variants, pending reviews, unanswered Q&A, recent contacts, newest users.
5. “View all / Manage” links hit real modules (`/admin/orders`, `/products`, `/qa`, `/reviews`, `/contact`, `/leads`, `/carts`, `/users`).
6. Empty lists show copy (“No orders yet”, “Queue is clear”, etc.).

```text
/admin
  → middleware (auth + ROLES.ADMIN)
  → getDashboardStatsService / getRecent* / getTop* / getOrderStatusBreakdownService
  → requireAdmin → dashboard.repository (createSupabaseAdminClient)
  → StatCards + attention tiles + preview lists
  → links into Sales / Catalog / Customers / Engagement modules
```

---

## P0 — Correctness (fix first)

- [ ] **“Active carts” counts every cart row**  
  `carts` has no status / abandoned flag. `select(..., { count: "exact", head: true })` on all rows is labeled as active carts. Misleading for ops. Same pattern on Analytics.  
  **Where:** `repositories/dashboard.repository.ts` (`getDashboardStats`); `app/admin/page.tsx`; `repositories/analytics.repository.ts`.  
  **Do:** Define “active” (e.g. updated within N days, or has items) and filter; or relabel to “Total carts”.

- [ ] **Month revenue / order count include cancelled (and refunded) totals**  
  Month query selects all `orders.total` since `startOfMonth` with **no** status / `payment_status` filter. Top sellers exclude `cancelled`, but KPI cards do not. Cancelled money still inflates “Revenue this month”.  
  **Where:** `repositories/dashboard.repository.ts` (`getDashboardStats` ~129–186 vs `getTopSellingProducts` `.neq("status", "cancelled")`).  
  **Do:** Align with business rule (e.g. exclude `cancelled` / `returned` and unpaid/`refunded` as required) for both count and sum.

- [ ] **Status / month aggregations risk silent under-count (~1000-row PostgREST cap)**  
  `orders.select("status")` and month `orders.select("total")` load row arrays; `totalOrdersThisMonth` uses `data.length`. Above default page size, pending/fulfillment/revenue/status mix under-report with no error.  
  **Where:** `repositories/dashboard.repository.ts` (`getDashboardStats`, `getOrderStatusBreakdown`).  
  **Do:** Use `count: exact` + filtered head counts, or SQL/RPC aggregates; never rely on unbounded `.select()` for totals.

- [ ] **Failures look like an empty store**  
  Services catch `requireAdmin` / errors and return empty stats; repos catch and return zeros/`[]`. Dashboard has no per-widget error UI (only `app/admin/error.tsx` if something throws). Missing service-role key or auth glitch → all zeros.  
  **Where:** `services/dashboard.service.ts`; `repositories/dashboard.repository.ts`; `app/admin/page.tsx`.  
  **Do:** Propagate errors (or a `ok: false` envelope) and show an error banner / retry; do not equate catch → empty.

---

## P1 — Incomplete / wrong dashboard behavior

- [ ] **No date-range controls**  
  Hard-coded calendar month (server TZ). No picker, compare period, or timezone note.  
  **Where:** `app/admin/page.tsx`; `repositories/dashboard.repository.ts`.  
  **Do:** Optional range query params; document TZ; or link “full charts” to Analytics with shared filters.

- [ ] **Metric definitions diverge from Analytics**  
  Low stock: dashboard variants `1–10` vs analytics products with any variant `≤5` (incl. 0). Products: dashboard `is_active` vs analytics “Active products” counting **all**. Carts / revenue filters differ.  
  **Where:** `repositories/dashboard.repository.ts` vs `repositories/analytics.repository.ts`.  
  **Do:** Shared metric helpers + identical labels (track full Analytics in its own Admin Flow doc).

- [ ] **Unanswered Q&A preview can disagree with KPI**  
  Count scans all Q/A; preview takes latest N questions then filters unanswered → old unanswered invisible while count &gt; 0.  
  **Where:** `getUnansweredQuestionsPreview` in `repositories/dashboard.repository.ts`.  
  **Do:** Query unanswered directly (order by created_at) for the preview.

- [ ] **Attention deep-links don’t pre-filter**  
  Pending orders → `/admin/orders` (client default `all`); low/OOS → `/admin/products` with no stock filter.  
  **Where:** `app/admin/page.tsx`; `OrdersTable`; `ProductsTable`.  
  **Do:** Pass query params (`?status=pending`, `?stock=low`) and honor them in tables.

- [ ] **Many preview rows are not clickable**  
  Reviews / Q&A / contacts / low-stock show data; section headers link out, but rows often lack entity links (`productId` on low stock unused).  
  **Where:** `app/admin/page.tsx`.  
  **Do:** Link rows to encrypted product/order/review/contact detail where pages exist.

- [ ] **`is_active` ignored for `/admin` access**  
  Deactivated admin still reaches dashboard (shared Guest Sign up P0).  
  **Where:** `middleware.ts`; `lib/auth/require-admin.ts`.  
  **Do:** See Guest Flow — Sign up / Log in.

---

## P2 — DX / UX

- [ ] **`StatCard` `trend` unused** — no MoM % on dashboard.  
  **Where:** `components/admin/stat-card.tsx`; `app/admin/page.tsx`.

- [ ] **“In fulfillment” includes `shipped`** — `processing` + `packed` + `shipped` may confuse ops.  
  **Where:** `repositories/dashboard.repository.ts`.  
  **Do:** Rename or split “Shipped” vs in-progress.

- [ ] **Shared admin loading only** — no per-widget skeletons.  
  **Where:** `app/admin/loading.tsx`.

- [ ] **Product Views not in Catalog sidebar children** — matchPrefixes includes `/admin/product-views`, but children are Products / Categories / Brands only; views reachable from products header / URL.  
  **Where:** `components/admin/app-sidebar.tsx`.  
  **Do:** Add Catalog child (also tracked under Catalog Admin Flow).

---

## Deferred (not dashboard bugs)

- [ ] Full Analytics module (`/admin/analytics` charts, AOV, growth) — own Admin Flow doc  
- [ ] Catalog / Sales / Customers / Engagement CRUD polish — own docs  
- [ ] Soft-delete / finance ledger — out of scope for overview KPIs  
- [ ] Dashboard unit tests for metric definitions

---

## Works as implemented (not bugs)

| Behavior | Why OK |
|----------|--------|
| Real DB queries (not mock series) | Service-role repos |
| Auth: middleware + `requireAdmin` + SR client | Same admin pattern as other modules |
| Empty states on every list | Copy when counts are zero |
| Recent order links via `encryptOrderId` | Matches admin orders routes |
| Guest orders labeled “Guest” | Expected for `user_id` null |
| `force-dynamic` layout | Fresh server render |

---

## Edge-case matrix

| Edge case | Status |
|-----------|--------|
| Empty DB | Works — zeros + empty messages; attention total hidden when 0 |
| Large order history | Risk — silent under-count (P0 row cap) |
| Cancelled orders this month | Inflate revenue/count until filtered (P0) |
| Duplicate product names in top sellers | Aggregates by name string |
| Server TZ for “this month” | Follows runtime TZ (often UTC in prod) |
| Missing `SUPABASE_SERVICE_ROLE_KEY` | Silent empty dashboard (P0 failure UX) |
| Non-admin hits `/admin` | Middleware redirect home |
| Inactive admin | Still allowed today (shared auth P0) |

---

## Key file map

| Concern | Path |
|---------|------|
| Dashboard page | `app/admin/page.tsx` |
| Loading / error | `app/admin/loading.tsx`, `app/admin/error.tsx` |
| Shell / nav | `app/admin/layout.tsx`, `components/admin/app-sidebar.tsx`, `components/admin/header.tsx` |
| Widgets | `components/admin/stat-card.tsx` |
| Services | `services/dashboard.service.ts` |
| DB | `repositories/dashboard.repository.ts` |
| Auth | `middleware.ts`, `lib/auth/require-admin.ts` |
| SR client | `lib/supabase/admin.ts` |
| Related (separate doc) | `app/admin/analytics/page.tsx`, `services/analytics.service.ts`, `repositories/analytics.repository.ts` |

---

## DB tables in this flow

| Table | Dashboard use |
|-------|----------------|
| `profiles` | Active user count; newest users |
| `products` / `customised_products` | Active products; low/OOS stock |
| `orders` / `order_items` | Month KPIs, recent, status mix, top sellers |
| `carts` | Cart count (currently all rows) |
| `reviews` | Pending count + preview |
| `product_questions` / answers | Unanswered count + preview |
| `contact_us` / `leads` | New / recent previews |

---

## Related docs

- Index: `docs/[08] Business Logic/flow.md` (Admin → Admin dashboard)
- Storefront as admin: `[04] Admin Flows/[01] Admin Flow - Storefront User Capabilities.md`
- Auth `is_active` gap: `[02] Guest Flow/[05] Guest Flow - Sign up Log in.md`
- Catalog / Analytics: sibling Admin Flow docs (Catalog next; Analytics later)

**Highest-impact fixes:** redefine carts + month revenue filters; aggregate with exact counts/RPC; surface errors instead of zeroed KPIs.
