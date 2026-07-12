# Lama Ecommerce — Project Strengths, Weaknesses & Threats Audit

**Date:** 2026-07-12  
**Scope:** Full codebase scan (architecture, security, features, performance, DX, deployment)  
**Stack:** Next.js 16 · TypeScript · Tailwind · Supabase · Zod · Radix UI / shadcn-style components  
**Verdict:** Strong layered foundation and broad admin/storefront coverage, but **not production-ready** until critical security and payment gaps are closed.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Strengths](#2-strengths)
3. [Weaknesses](#3-weaknesses)
4. [Threats](#4-threats)
5. [What Needs Fixing](#5-what-needs-fixing)
6. [Feature Completeness Matrix](#6-feature-completeness-matrix)
7. [Architecture Compliance Snapshot](#7-architecture-compliance-snapshot)
8. [Appendix — Key Evidence Paths](#8-appendix--key-evidence-paths)

---

## 1. Executive Summary

| Dimension | Score (1–5) | Notes |
|-----------|-------------|--------|
| Architecture intent | 4 | Clear layers documented and mostly followed |
| Security | 4 | Guest RLS, checkout ownership, admin API/actions authz, open redirect, rate limits, deny-all table policies fixed (2026-07-12) |
| Feature breadth | 4 | Admin + storefront are wide; payments/search/emails incomplete |
| Production readiness | 2 | Stripe deferred; no CI, empty env example remain |
| Performance | 4 | Catalog server-paginated; root force-dynamic removed; carts list batched |
| Testing | 1 | Zero automated tests |
| Documentation | 3 | Deep phase/bedrock docs, but drift vs real code |

**Bottom line:** Core security blockers from the audit (guest RLS, checkout ownership, admin/backup authz, open redirect, form spam, deny-all RLS gaps) are **resolved✅**. Still deferred: Stripe, catalog performance, CI/env/docs. Do not ship payments or high traffic without those.

---

## 2. Strengths

### 2.1 Architecture & Separation of Concerns

- Documented layered model: `app` → `actions` → `services` → `repositories` → Supabase (see `.cursor/rules/rule1.mdc`, `docs/bedrock/ARCHITECTURE_FLOW.md`).
- UI layer is clean: **no Supabase calls under `components/`**.
- Large service (~22) and repository (~23) catalogs exist with intentional separation for most domains.
- Auth helpers, Zod validators, and typed domain shapes are established under `lib/` and `types/`.

### 2.2 Data Integrity & Checkout Design

- Atomic checkout RPC (`supabase/migrations/20260220120005_checkout_function.sql`):
  - Validates stock for all items before mutations
  - Creates order + order-item snapshots
  - Decrements stock with race-safe `quantity_stock` checks
  - Soft-deletes cart after success
- Checkout service resolves shipping fee server-side (`services/checkout.service.ts`) — does not trust client money fields.
- Zod validation on checkout and many create/update forms (`lib/validators/`).

### 2.3 Auth, RBAC & Middleware (Pages)

- `middleware.ts` protects `/admin` (requires `profile.role === ADMIN`), `/account`, and `/profile` (auth + active profile).
- Product / brand / category server actions consistently check admin via `getCurrentUserProfile()` + `ROLES.ADMIN`.
- DB trigger blocks role self-escalation (`prevent_role_change` in profiles RLS migration).
- Guest cart cookies use `httpOnly`, `sameSite: "lax"`, and `secure` in production (`actions/cart.ts`).

### 2.4 RLS Foundations

- RLS enabled on core tables (`20260128101527_rls_policies.sql`).
- Public product read scoped to active products.
- Reviews: inserts forced to `pending`; public read only approved.
- Some admin domains correctly use session + role checks (profile, promo, shipping zone services).

### 2.5 Product Surface Area

- **Public:** home, products list/detail, cart, wishlist, orders, order details, auth, profile, static pages.
- **Account:** profile + wishlist under `(useraccount)`.
- **Admin:** dashboard, products (list/grid/details/variants/images), categories, brands, carts, orders, users, analytics, Q&A, reviews, contact, leads, backups, shipping, promocodes.
- Root error/loading/not-found scaffolding exists (`app/error.tsx`, `app/global-error.tsx`, `app/not-found.tsx`, `app/loading.tsx`, `app/admin/loading.tsx`).
- `next/image` + remote patterns for Supabase/Unsplash (`next.config.ts`).

### 2.6 Security Hygiene (Partial)

- No `dangerouslySetInnerHTML` / `eval` XSS sinks found.
- Service-role client is server-only (`lib/supabase/admin.ts`) and throws if env is missing.
- Order ID encryption via AES-GCM (`lib/utils/encryption.ts`) for URL obfuscation (obscurity only — not access control).

---

## 3. Weaknesses

Severity legend: **Critical** · **High** · **Medium** · **Low**

### 3.1 Security

| Sev | Issue | Evidence |
|-----|--------|----------|
| **Critical** | ~~Guest cart / order / wishlist RLS allows any anon client to read/write rows where `user_id IS NULL` (session_id not enforced in policy)~~ — **resolved✅** | Fixed in `20260712100000_fix_guest_rls_and_checkout_ownership.sql` + service-role guest paths scoped by cookie `session_id` |
| **Critical** | ~~`process_checkout` ownership check skips when cart is guest or `p_user_id` is null; function executable by `anon`~~ — **resolved✅** | Fixed: requires user **or** session match; `EXECUTE` revoked from anon/authenticated (service_role only) |
| **Critical** | ~~Admin order update/delete actions have **no admin check**; repositories use service role~~ — **resolved✅** | Fixed: `requireAdmin()` on `updateOrderAction` / `updateOrderStatusAction` / `deleteOrderAction` (+ service `canAccessAdmin`) |
| **Critical** | ~~Backup actions have **no auth**; DB extract API only requires “logged in”, not admin~~ — **resolved✅** | Fixed: `canAccessAdmin` on backup actions/services + extract route; middleware gates `/api/admin` |
| **Critical** | ~~Middleware treats **all `/api` as public**; matcher also excludes API~~ — **resolved✅** | Fixed: matcher includes API; `/api/admin` requires admin (JSON 401/403); `/api/auth` allowed |
| **High** | ~~Other admin surfaces under-auth’d (leads, cart admin paths, product_view admin, etc.) — pattern of “check in UI”~~ — **resolved✅** | Fixed: `requireAdmin()` on lead / cart-admin / product_view admin actions + services |
| **High** | ~~Auth callback open redirect: `next` passed into `new URL(next, origin)` allows absolute external URLs~~ — **resolved✅** | Fixed: `lib/auth/safe-redirect.ts` + callback + LoginForm |
| **High** | ~~Fake payment UX / client-implied paid checkout; `payment_status` via unprotected order updates~~ — **resolved✅** (interim) | Fake delay removed; place-order UX; `payment_status` admin-only. **Stripe still deferred.** |
| **Medium** | ~~Tables with RLS on but **no policies** (deny-all for session; all access via service role): payments, shipments, shipping_zones, shipping_fees, product_stats, promo_codes~~ — **resolved✅** | Fixed: `20260712110000_rls_policies_payments_shipping_promo_stats.sql` |
| **Medium** | ~~Contact / leads public insert with no rate limiting~~ — **resolved✅** | Fixed: `20260712110001_contact_leads_rate_limit.sql` + `lib/rate-limit.ts` + contact/lead actions (public INSERT policies dropped) |
| **Medium** | ~~Guest session IDs using weak entropy (`Math.random`) in some paths~~ — **resolved✅** | Fixed: `crypto.randomUUID()` + UUID cookie validation in `lib/auth/guest-session.ts` |
| **Low** | ~~`get_user_role()` SECURITY DEFINER without locked `search_path`~~ — **resolved✅** | Fixed: `20260712200000_lock_get_user_role_search_path.sql` (`SET search_path = public`) |

### 3.2 Architecture Drift

| Sev | Issue | Evidence |
|-----|--------|----------|
| **High** | ~~Services call Supabase directly (violates rule)~~ — **resolved✅** | Removed dead `validateStockAvailability` from `cart.service.ts`; services use repositories only |
| **High** | ~~Actions talk to Storage / tables / repos directly, skipping service authz~~ — **resolved✅** | Brand logos + logout moved to services; admin contact/Q&A pages use services; identity helpers may still call auth repo |
| **High** | ~~Zustand + TanStack Query are in `package.json` / rules but **unused**~~ — **resolved✅** | Removed unused deps; RSC + server actions for data; React state for client UI |
| **Medium** | ~~Widespread `as any` in repositories and middleware weakens type safety~~ — **resolved✅** | Expanded `types/supabase.ts`; stripped casts from middleware + order/cart/analytics repos |

### 3.3 Performance

| Sev | Issue | Evidence |
|-----|--------|----------|
| **Critical** | ~~Products pages fetch up to **10,000** products for client-side filtering~~ — **resolved✅** | Server-side filter/sort/page + price bounds; related via tiered bounded queries |
| **Critical** | ~~Entire app `export const dynamic = 'force-dynamic'` — no static/ISR caching~~ — **resolved✅** | Removed from root; `AuthProvider` client profile fetch; admin layout keeps `force-dynamic` |
| **High** | ~~Admin carts list N+1 (items fetched per cart)~~ — **resolved✅** | Batched `cart_items` aggregate in `getAllCartsForAdmin` |

### 3.4 Feature / Product Gaps

| Sev | Issue | Evidence |
|-----|--------|----------|
| **Critical** | ~~Payment is simulated (2s delay → pending order)~~ — **resolved✅** (interim); Stripe/webhook/`payments` insert still deferred | Place-order flow; no fake delay; still no `stripe` dependency |
| **High** | No password-reset / forgot-password flow | Missing routes/actions vs plan |
| **High** | No Super Admin role (only `user` / `admin`) | `lib/constants/roles.ts` |
| **High** | No dedicated `/search` route; promo codes not applied at checkout (`discount: 0`) | Route tree; `services/checkout.service.ts` |
| **High** | No order confirmation email / notification provider | Plan Phase 6; no email SDK |
| **Medium** | Account deep links broken (`/account/addresses`, `/account/payments`) | `components/(public)/profile/ProfileActions.tsx` |
| **Medium** | Website content admin is a stub (sidebar entry commented out) | `app/admin/website-content/page.tsx` |
| **Medium** | ~~Post-checkout redirects to empty cart instead of order confirmation~~ — **resolved✅** | Redirects to `/order_details/[encryptedId]` |
| **Low** | `docs/todo.todo` item `moved_to_order` on cart — not implemented | `docs/todo.todo` |

### 3.5 DX, Docs & Deployment

| Sev | Issue | Evidence |
|-----|--------|----------|
| **High** | ~~No CI workflows (no `.github/workflows`)~~ — **resolved✅** | `.github/workflows/ci.yml`: lint + vitest + build (Playwright e2e deferred) |
| **High** | ~~`.env.example` is empty~~ — **resolved✅**; ~~README is create-next-app boilerplate~~ — **resolved✅** | `.env.example` + root `README.md` (env, migrate, scripts) |
| **High** | ~~Zero automated tests (`*.test.*` / `*.spec.*`)~~ — **resolved✅** | Vitest unit/feature suites under `tests/`; Playwright smoke under `e2e/` |
| **Medium** | Docs overstate readiness (“Stripe-ready”, password reset, Super Admin, search) | `docs/summarization.txt` vs code |
| **Medium** | ~~Bedrock structure docs describe `src/(storefront)` but app uses root `app/(public)`~~ — **resolved✅** | Synced `docs/[03] Bedrock` + phase path refs to `app/(public)`, `services/`, `repositories/` |
| **Medium** | ~~Possible secret material in docs command file~~ — **resolved✅** (working tree); rotate key + purge history if not done | Stubbed `docs/[04] CMDs/api_test_Stripe.txt`; see CMDs README for history purge |
| **Low** | Duplicate/legacy Supabase helper packages (`@supabase/auth-helpers-nextjs` + `@supabase/ssr`) | `package.json` |
| **Low** | ~~Sparse per-route loading/error boundaries outside root + admin~~ — **resolved✅** | Products + admin products/orders/carts `loading`/`error`; skip link; Radix dialog focus trap |

---

## 4. Threats

| # | Threat | Likelihood | Impact | Notes |
|---|--------|------------|--------|-------|
| T1 | ~~Enumerate / mutate all guest carts, wishlists, and guest orders via anon key + permissive RLS~~ — **resolved✅** | — | — | Guest rows denied to anon; app uses service role + cookie `session_id` |
| T2 | ~~Checkout arbitrary cart UUID → steal stock / create fraudulent orders~~ — **resolved✅** | — | — | Ownership requires matching user/session; anon cannot EXECUTE RPC |
| T3 | ~~Any logged-in user downloads full DB SQL dump~~ — **resolved✅** | — | — | Extract route + backup service require admin; middleware gates `/api/admin` |
| T4 | ~~Any caller of unprotected server actions updates/deletes orders, backups, leads~~ — **resolved✅** | — | — | `requireAdmin` / `canAccessAdmin` on order, backup, lead, cart-admin, product_view |
| T5 | ~~Open redirect after OAuth/login → phishing~~ — **resolved✅** | — | — | `safeRedirectPath` on callback + LoginForm |
| T6 | ~~Spam flood on contact/leads~~ — **resolved✅** | — | — | Public INSERT policies dropped; DB rate limit + honeypot |
| T7 | ~~Fake “paid” UX / unauthenticated `payment_status` abuse~~ — **resolved✅** (interim) | — | — | Place-order UX; admin-only payment_status; Stripe still deferred |
| T8 | ~~Catalog / cost DoS from 10k product fetch under load~~ — **resolved✅** | — | — | Server-side pageSize cap + related tier queries |
| T9 | ~~Secret leak in docs~~ — **resolved✅** (working tree); rotate key + optional history purge still recommended | — | — | Stubbed docs file; purge commands in `docs/[04] CMDs/README.md` |
| T10 | ~~Stale docs cause wrong security assumptions (“RLS + middleware is enough”)~~ — **partially mitigated** | **Low** | **Medium** | Middleware now covers `/api/admin`; actions still need per-route authz (mostly in place) |

---

## 5. What Needs Fixing

### P0 — Production blockers (do first)

1. ~~**Rewrite guest RLS** — bind guest access to verified `session_id`…~~ — **resolved✅** (`20260712100000_fix_guest_rls_and_checkout_ownership.sql` + cookie-scoped service-role repos)
2. ~~**Harden `process_checkout`** — require cart `user_id` **or** `session_id` match; set `search_path`; restrict `EXECUTE` grants.~~ — **resolved✅**
3. ~~**`requireAdmin()` on order / backup / extract / leads / cart-admin / product_view**~~ — **resolved✅**
4. ~~**Remove or lock down DB extract**~~ — **resolved✅** (admin-only on route + service + middleware)
5. **Implement real payments (deferred)** — Stripe (or equivalent) + webhook; write `payments` rows; set `payment_status` only after confirmed payment. *(Fake delay / place-order UX — **resolved✅**.)*
6. ~~**Fix products listing** — server-side filter/sort/pagination; remove `pageSize: 10000`.~~ — **resolved✅** (`/products` paginated; FeaturedProducts uses `isFeatured: true`, pageSize 12)
7. ~~**Scrub secrets from docs**~~ — **resolved✅** (working tree stubbed); **you must still rotate the leaked key** and optionally purge git history (commands in `docs/[04] CMDs/README.md`).
8. ~~**Fill `.env.example`** with key names only~~ — **resolved✅**; `ENCRYPTION_KEY` error strings aligned in `lib/utils/encryption.ts`.

### P1 — Correctness & security hardening

9. ~~Validate auth callback `next` — allow only relative same-origin paths~~ — **resolved✅** (`lib/auth/safe-redirect.ts`)
10. ~~Narrow `force-dynamic` to auth-aware layouts; allow caching for public catalog/home where safe.~~ — **resolved✅**
11. ~~Fix carts admin N+1 query.~~ — **resolved✅**
12. ~~Move all Supabase access out of services/actions into repositories; add service-layer authz for admin domains that currently rely on service role alone.~~ — **resolved✅** (`requireAdmin` on Q&A/contact/lead/analytics/dashboard/brand/product/review services; brand Storage + logout via services)
13. ~~Prefer session client + admin RLS over service role except break-glass (user create, dumps).~~ — **resolved✅** (promo + shipping repos use session client; break-glass kept for guest cart/wishlist, checkout RPC, backups, user create, rate-limit, counters)
14. ~~Add rate limiting for public inserts (contact, leads)~~ — **resolved✅**; still open for checkout / product views if needed.
15. Wire promo codes into checkout; ~~redirect to `/order_details/[id]` after success~~ — **resolved✅**; order confirmation email still open.
16. Password reset flow; decide Super Admin vs single admin and enforce consistently.
17. ~~Use `crypto.randomUUID()` (or better) for guest session IDs.~~ — **resolved✅**
18. ~~Add least-privilege RLS for payments / shipments / shipping / promo / product_stats~~ — **resolved✅** (`20260712110000_…`)
19. ~~Lock `get_user_role()` `search_path`~~ — **resolved✅** (`20260712200000_…`)

### P2 — Completeness & DX

20. Dedicated search (server-side); optional multi-step `/checkout` if desired.
21. Fix ProfileActions dead links; finish or remove website-content admin.
22. Implement or drop `moved_to_order` (`docs/todo.todo`).
23. ~~Add CI: `lint` + `build` (and later tests).~~ — **resolved✅** (`.github/workflows/ci.yml`: lint + vitest + build; Playwright deferred)
24. ~~Replace README with real setup (env, Supabase migrate, scripts).~~ — **resolved✅**
25. ~~Sync bedrock/phase docs to actual folders (`app/(public)`, no `src/`).~~ — **resolved✅**
26. ~~Add React Query provider **or** remove unused dependency; same for Zustand.~~ — **resolved✅** (removed unused packages)
27. ~~Reduce `as any`; generate/use typed Supabase client properly.~~ — **resolved✅** (middleware + order/cart/analytics; `types/supabase.ts` expanded)
28. ~~Add tests: RLS guest isolation, checkout ownership, admin authz on actions, open-redirect negatives, stock race.~~ — **resolved✅** (Vitest; live RLS still via checklist)
29. ~~Route-level loading/error for heavy product/admin pages; expand a11y (skip links, focus traps).~~ — **resolved✅**
30. ~~Add security headers / CSP when deploying (Vercel or `next.config`).~~ — **resolved✅** (`next.config.ts` headers)

---

## 6. Feature Completeness Matrix

| Area | Documented | Actual | Gap |
|------|------------|--------|-----|
| Foundation / schema / migrations | Yes | Yes | — |
| Auth login/signup | Yes | Yes | — |
| Password reset | Yes | **No** | Missing |
| Super Admin | Yes | **No** | Only admin/user |
| Middleware page RBAC | Yes | Yes | `/api/admin` gated; actions use `requireAdmin` |
| RLS | Yes | Yes (core + payments/shipping/promo/stats) | Guest via service role + cookie |
| Storefront catalog | Yes | Yes | — |
| Search page | Yes | **No** | Missing route |
| Cart (guest + user) | Yes | Yes (server-side) | — |
| Wishlist | Yes | Yes | Guest via service role + session |
| Checkout atomic | Yes | Yes | Ownership hardened |
| Stripe payments | “Stripe-ready” | Place-order + pending (Stripe deferred) | Deferred |
| Order emails | Yes | **No** | Missing |
| Promo at checkout | Admin exists | **Not applied** | `discount: 0` |
| Account dashboard | Full plan | Thin | Dead links |
| Admin products/orders/users | Yes | Yes | — |
| Admin analytics | Yes | Yes | — |
| Admin backups | Yes | Yes | Authz **resolved✅** |
| Admin shipping / promocodes | Yes | Yes | Promo unused at checkout |
| Website CMS | Planned | Stub | — |
| Settings page | Planned | Missing | — |
| Automated tests | Implied production | Vitest unit/feature in CI; Playwright smoke local-only | E2E not in CI yet |
| CI / env example / README | Implied | Yes | — |

---

## 7. Architecture Compliance Snapshot

| Rule (from project rules) | Status |
|---------------------------|--------|
| Components → no Supabase | **Pass** |
| Services → no Supabase | **Pass** |
| Actions → thin orchestration only | **Pass** (brand Storage + logout via services; identity helpers may call auth repo) |
| Repositories own data access | **Pass** |
| Authz in middleware + RLS + service | **Pass** — admin services gated with `requireAdmin`; promo/shipping use session + admin RLS |
| Zod on inputs | **Partial pass** — strong on checkout/many forms; inconsistent on admin updates |
| TanStack Query for client fetch | **N/A** — dependency removed; RSC/actions used |
| Zustand for client UI state | **N/A** — dependency removed; React state used |

---

## 8. Appendix — Key Evidence Paths

```
middleware.ts
app/layout.tsx
app/(public)/products/page.tsx
app/(public)/auth/callback/route.ts
app/api/admin/backups/extract/route.ts
actions/order.ts
actions/backup.ts
actions/cart.ts
actions/lead.ts
actions/contact_us.ts
components/(public)/cart/CartSidebar.tsx
lib/auth/safe-redirect.ts
lib/auth/guest-session.ts
lib/auth/require-admin.ts
lib/rate-limit.ts
services/cart.service.ts
services/checkout.service.ts
lib/supabase/admin.ts
lib/utils/encryption.ts
supabase/migrations/20260712100000_fix_guest_rls_and_checkout_ownership.sql
supabase/migrations/20260712110000_rls_policies_payments_shipping_promo_stats.sql
supabase/migrations/20260712110001_contact_leads_rate_limit.sql
supabase/migrations/20260712200000_lock_get_user_role_search_path.sql
docs/[04] CMDs/api_test_Stripe.txt   ← stub only (no live keys); purge history if needed
docs/summarization.txt          ← overstates readiness
docs/todo.todo
.env.example                    ← key names only (filled)
package.json                    ← no stripe; Vitest present; RQ/Zustand removed
```

---

## Recommended Next Sprint (suggested order)

1. ~~Guest RLS + checkout ownership~~ — **resolved✅**
2. ~~Open redirect + place-order UX + order/backup/lead admin authz + extract lock~~ — **resolved✅**
3. ~~Deny-all table RLS + contact/leads rate limit + `get_user_role` search_path~~ — **resolved✅**
4. ~~Products pagination/filters + FeaturedProducts (no 10k fetch) + force-dynamic~~ — **resolved✅**
5. ~~`.env.example` + docs secret scrub~~ — **resolved✅**; rotate leaked key + history purge if desired; README/CI polish
6. Real Stripe when ready; password reset, promo at checkout, confirmation email
7. ~~Architecture cleanup (service authz + promo/shipping session RLS)~~ — **resolved✅**; remaining admin-client demotions + tests still open

---

*End of report. Generated from a full-repo scan on 2026-07-12. Security P0/P1 items above marked **resolved✅** after multi-agent fixes the same day.*
