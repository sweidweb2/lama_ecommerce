# Client Flow — Profile & Settings

**Scope:** Logged-in customer `flow.md` bullet “Profile / settings” — historical `/profile` hub and `/profile/setting`.  
**Out of scope:** Live account management (password, addresses, profile edit) — that is `/account` ([03] Client Flow - Account). Admin user CRUD.

**Verdict:** **Consolidated onto `/account`.** `/profile` and `/profile/setting` **redirect** to `/account`. Dummy John Doe hub removed. Navbar and admin header both link to `/account`. Middleware still gates `/profile*` (auth + `is_active`) before redirect.

---

## Happy path (what works today)

1. Authed active user opens `/profile` or `/profile/setting` → **redirect to `/account`**.
2. Storefront Navbar “Profile” → **`/account`**.
3. Admin header “Profile” → **`/account`**.
4. Live management (name, password, addresses) is only on `/account` — see Account doc.

```text
/profile
  → middleware (auth + is_active)
  → redirect /account  ✅

/profile/setting
  → middleware (auth + is_active)
  → redirect /account  ✅

Navbar → /account  ✅
Admin header → /account  ✅
```

---

## Account vs Profile (relationship)

| Surface | Route | Status |
|---------|--------|--------|
| Account | `/account` | Live — real profile read/edit, password, addresses |
| Profile hub | `/profile` | Redirect → `/account` |
| Settings | `/profile/setting` | Redirect → `/account` |

Single product surface: **`/account`**. Legacy `/profile*` routes exist only as redirects.

---

## P0 — Correctness (fix first)

- [x] ✅ **`/profile` shows fake identity and orders to real logged-in users** done✅  
  Hard-coded John Doe, fabricated order totals/status. Anyone with an active session who lands here (e.g. admin header “Profile”) sees **wrong** personal data.  
  **Where:** `app/(public)/profile/page.tsx`; hub components.  
  **Do:** Wire to real data **or** redirect `/profile` → `/account` and remove dummy components; fix admin header link to `/account`.  
  **Done:** Both `/profile` and `/profile/setting` redirect to `/account`; dummy hub components removed; admin header → `/account`.

---

## P1 — Incomplete / wrong profile/settings behavior

- [x] ✅ **Admin header links to `/profile` (dummy)** done✅  
  **Where:** `components/admin/header.tsx`.  
  **Done:** Points to `/account`.

- [x] ✅ **`flow.md` “Profile / settings” unmet** done✅  
  **Do:** Implement settings **or** redirect → `/account` and treat Account doc as the single source; update `flow.md` if consolidating.  
  **Done:** Redirects to `/account`; `flow.md` notes consolidation.

- [x] ✅ **`ProfileOrders` uses raw UUID links** done✅ / **n/a**  
  Component removed with hub; orders live under `/orders`.

---

## P2 — DX / polish

- [x] ✅ **`ProfileStats` “Active Orders” hard-coded `0`** done✅ / **n/a**  
  Component removed with hub redirect.

- [x] ✅ **Duplicate wishlist entry points** (`/account/wishlist` vs `/wishlist`) done✅  
  **Done:** `/account/wishlist` redirects to `/wishlist`.

- [x] ✅ **`data-testid="profile-settings-heading"` without product** done✅ / **n/a**  
  Settings page is redirect-only; testid removed.

---

## Deferred / works-as-implemented

| Behavior | Why OK / deferred |
|----------|-------------------|
| Middleware gate on `/profile*` | Same as `/account` — intentional before redirect |
| Hub concept (stats, quick actions, recent orders) | Dropped; `/account` + `/orders` / `/wishlist` cover needs |
| Real password / addresses / name edit | Implemented on `/account` ([03]) |

---

## Edge-case matrix

| Case | Status |
|------|--------|
| Authed → `/profile` | Redirect → `/account` |
| Authed → `/profile/setting` | Redirect → `/account` |
| Unauthed / inactive | Middleware → login |
| Navbar Profile | → `/account` |
| Admin header Profile | → `/account` |

---

## Key file map

| Concern | Path |
|---------|------|
| Profile redirect | `app/(public)/profile/page.tsx` |
| Settings redirect | `app/(public)/profile/setting/page.tsx` |
| Shared header (account) | `components/(public)/profile/ProfileHeader.tsx` |
| Live account | `app/(useraccount)/account/page.tsx` |
| Nav | `components/common/Navbar.tsx` → `/account` |
| Admin link | `components/admin/header.tsx` → `/account` |
| Gate | `middleware.ts` (`/profile`) |

---

## Related docs

- Index: `flow.md` (User → Profile / settings → `/account`)
- Live account: `[03] Client Flow - Account.md`
- Guest capabilities / idle: `[02] Client Flow - Guest Capabilities.md`
- Auth inactive gate: Guest Sign up

**Status:** Profile/settings consolidated to `/account`. No dummy identity in production chrome.
