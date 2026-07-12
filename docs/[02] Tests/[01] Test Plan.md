# Test Plan — Lama Ecommerce

**Date:** 2026-07-12  
**Stack:** Next.js 16 · TypeScript · Vitest (unit + feature with mocks)  
**Status:** Wave 1 ✅ · Wave 2 ✅ · Wave 3 ✅

---

## 1. Goals

| Goal | Notes |
|------|--------|
| Catch authz regressions | Admin gates on orders/backups must stay enforced |
| Catch form spam gaps | Contact/lead honeypot + rate-limit must stay wired |
| Protect pure helpers | Permissions, redirects, Zod schemas |
| Stay fast / offline | Wave 1 uses mocks — **no live Supabase** |

Architecture under test follows: `actions` → `services` → `repositories` (mock at boundaries).

---

## 2. How to run

```powershell
npm test
npm run test:watch
```

See [README.md](./README.md).

---

## 3. Layout

```
tests/
  setup.ts
  helpers/mocks.ts
  unit/
    auth/permissions.test.ts
    auth/safe-redirect.test.ts
    validators/contact-us.create.test.ts
    validators/lead.create.test.ts
    rate-limit.test.ts
  feature/
    order-admin-auth.test.ts
    backup-admin-auth.test.ts
    contact-lead-actions.test.ts
```

**Naming:** `*.test.ts` · describe by module · `it` / `test` for one behavior.

---

## 4. Wave 1 ✅ (done) — map

### Unit ✅

| File | Cases |
|------|--------|
| `lib/auth/permissions.ts` ✅ | `canAccessAdmin` admin only; `canEditProfile` own vs other |
| `lib/auth/safe-redirect.ts` ✅ | allow relative `/path`; reject `//`, `\`, absolute URLs, encoded schemes |
| `lib/validators/contact_us/create.ts` ✅ | valid; empty fields; bad email; phone → null |
| `lib/validators/lead/create.ts` ✅ | valid / invalid email |
| `lib/rate-limit.ts` ✅ | allow empty/expired window; deny at limit; increment when under limit |

### Feature (mocked) ✅

| File | Cases |
|------|--------|
| `services/order.service.ts` ✅ | non-admin Forbidden / empty; admin reaches repo |
| `services/backup.service.ts` ✅ | non-admin empty/null/false/Forbidden |
| `actions/contact_us.ts`, `actions/lead.ts` ✅ | honeypot fake success; rate-limit error; happy path inserts once |

---

## 5. Wave 2 ✅ (done)

| Area | Cases | Status |
|------|--------|--------|
| `lib/auth/require-admin.ts` | throws for non-admin; returns profile for admin | ✅ `tests/unit/auth/require-admin.test.ts` |
| `lib/auth/guest-session.ts` | cookie create/read/clear; reject non-UUID | ✅ `tests/unit/auth/guest-session.test.ts` |
| Checkout service | server-side shipping fee; invalid zone; no client totals | ✅ `tests/feature/checkout-service.test.ts` |
| Order ownership | `getOrderDetails` user vs guest vs forbidden | ✅ `tests/feature/order-ownership.test.ts` |
| Promo / shipping zone services | admin gates mirror order/backup | ✅ `tests/feature/promo-admin-auth.test.ts`, `shipping-zone-admin.test.ts` |
| More Zod validators | checkout, product create, cart base | ✅ `tests/unit/validators/*` |

**Note:** `createCartSchema.partial()` throws under Zod 4 when the base has refinements — Wave 2 covers `cartBaseSchema` instead.

---

## 6. Wave 3 ✅ (done — CI + checklist + optional E2E)

| Area | Notes | Status |
|------|--------|--------|
| Playwright E2E | Smoke: home, contact form, `/admin` deny — gated by `E2E_RUN=1` | ✅ `e2e/smoke.spec.ts` |
| RLS integration | Manual checklist against live/local Supabase | ✅ [RLS_CHECKLIST.md](./RLS_CHECKLIST.md) |
| CI | `.github/workflows/ci.yml` → lint + test + build | ✅ |

```powershell
# Optional E2E (app must be running)
$env:E2E_RUN="1"
$env:E2E_BASE_URL="http://127.0.0.1:3000"
npx playwright install chromium
npm run test:e2e
```

---

## 7. Mock rules

1. Prefer `vi.mock` of `@/services/profile.service`, `@/lib/supabase/admin`, repositories.
2. Do not hit network or real DB in Wave 1–2.
3. Failures should assert **behavior** (`Forbidden`, empty arrays), not implementation details of Supabase clients.

---

## 8. Success criteria

### Wave 1 ✅
- [x] `docs/[02] Tests/TEST_PLAN.md` + `README.md` exist
- [x] `npm test` green for Wave 1 suite
- [x] Coverage of recent security hardening (admin authz, rate-limit, honeypot, safe redirect)

### Wave 2 ✅
- [x] require-admin + guest-session unit tests
- [x] checkout / order ownership / promo / shipping feature tests
- [x] checkout + product + cart Zod tests

### Wave 3 ✅
- [x] CI workflow (lint + test + build)
- [x] RLS checklist doc
- [x] Playwright smoke suite (opt-in via `E2E_RUN=1`)
