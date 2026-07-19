# Client Flow — Profile & Settings

**Scope:** Logged-in customer `flow.md` bullet “Profile / settings” — `/profile` hub and `/profile/setting`.  
**Out of scope:** Live account management (password, addresses, real profile read) — that is `/account` ([03] Client Flow - Account). Admin user CRUD.

**Verdict:** **Not implemented as a product surface.** `/profile` is a **dummy John Doe** page with fake orders/stats (misleading if linked). `/profile/setting` is an explicit **“coming soon”** stub. Middleware still requires auth + `is_active`. Navbar correctly sends customers to `/account`; **admin header still links `/profile`**.

---

## Happy path (what works today)

1. Authed active user can open `/profile` and `/profile/setting` (middleware gate only).
2. `/profile` renders hard-coded `dummyProfile` / `dummyOrders` / fake stats — **not** the session user.
3. Quick actions on the dummy hub: Addresses → `/account` (real); Settings → `/profile/setting` (stub); Orders → `/orders` (real list).
4. `/profile/setting` shows “Settings page coming soon…”.
5. Storefront Navbar “Profile” → **`/account`** (correct live path).

```text
/profile
  → middleware (auth + is_active)
  → dummy John Doe + fake orders/stats  ✗ not session data

/profile/setting
  → middleware (auth + is_active)
  → “coming soon…” stub

Navbar → /account  ✅
Admin header → /profile  ✗ dummy
```

---

## Account vs Profile (relationship)

| Surface | Route | Status |
|---------|--------|--------|
| Account | `/account` | Live — real profile read, password, addresses |
| Profile hub | `/profile` | Stub — fake identity/orders |
| Settings | `/profile/setting` | Stub — placeholder copy |

They are **different unfinished product shapes**, not two UIs of the same feature. Live management is **only** on `/account`.

---

## P0 — Correctness (fix first)

- [ ] **`/profile` shows fake identity and orders to real logged-in users**  
  Hard-coded John Doe, fabricated order totals/status. Anyone with an active session who lands here (e.g. admin header “Profile”) sees **wrong** personal data.  
  **Where:** `app/(public)/profile/page.tsx` (`dummyProfile`, `dummyOrders`); `components/(public)/profile/*`.  
  **Do:** Wire to `getCurrentUserProfile` + real orders/wishlist **or** redirect `/profile` → `/account` and remove dummy components; fix admin header link to `/account`.

---

## P1 — Incomplete / wrong profile/settings behavior

- [ ] **Admin header links to `/profile` (dummy)**  
  Customers use Navbar → `/account`; admins shopping/panel chrome hit the stub.  
  **Where:** `components/admin/header.tsx`.  
  **Do:** Point to `/account`.

- [ ] **`flow.md` “Profile / settings” unmet**  
  Password/addresses live on `/account`; settings page is empty.  
  **Where:** `app/(public)/profile/setting/page.tsx`.  
  **Do:** Implement settings (name, password, prefs) **or** redirect → `/account` and treat Account doc as the single source; update `flow.md` if consolidating.

- [ ] **`ProfileOrders` uses raw UUID links**  
  Production order details often use encrypted ids. Dummy links would be wrong even if data were real.  
  **Where:** `components/(public)/profile/ProfileOrders.tsx`.  
  **Do:** When wiring, use `encryptOrderId` like elsewhere.

---

## P2 — DX / polish

- [ ] **`ProfileStats` “Active Orders” hard-coded `0`**  
  **Where:** `ProfileStats.tsx`.  
  **Do:** Compute from real data or drop with stub.

- [ ] **Duplicate wishlist entry points** (`/account/wishlist` vs `/wishlist`)  
  **Do:** Clarify single wishlist surface (later Wishlist Customer Flow bullet).

- [ ] **`data-testid="profile-settings-heading"` without product**  
  **Do:** Keep only if shipping real settings.

---

## Deferred / works-as-implemented

| Behavior | Why OK / deferred |
|----------|-------------------|
| Middleware gate on `/profile*` | Same as `/account` — intentional |
| Placeholder settings copy | Explicit stub |
| Hub concept (stats, quick actions, recent orders) | Never finished — product decision |
| Real password / addresses | Implemented on `/account` ([03]) |

---

## Edge-case matrix

| Case | Status |
|------|--------|
| Authed → `/profile` | Dummy John Doe UI (**P0**) |
| Authed → `/profile/setting` | Stub copy |
| Unauthed / inactive | Middleware → login |
| Click Addresses on hub | → `/account` (real) |
| Click Settings on hub | → stub |
| Click order “View Details” | Wrong/fake ids vs production |
| Navbar Profile | → `/account` (good) |
| Admin header Profile | → `/profile` (bad) |

---

## Key file map

| Concern | Path |
|---------|------|
| Profile hub | `app/(public)/profile/page.tsx` |
| Settings stub | `app/(public)/profile/setting/page.tsx` |
| Hub UI | `components/(public)/profile/ProfileHeader.tsx`, `ProfileStats.tsx`, `ProfileActions.tsx`, `ProfileOrders.tsx` |
| Live account | `app/(useraccount)/account/page.tsx` |
| Nav | `components/common/Navbar.tsx` → `/account` |
| Admin link | `components/admin/header.tsx` → `/profile` |
| Gate | `middleware.ts` (`/profile`) |

---

## Related docs

- Index: `flow.md` (User → Profile / settings)
- Live account: `[03] Client Flow - Account.md`
- Guest capabilities / idle: `[02] Client Flow - Guest Capabilities.md`
- Auth inactive gate: Guest Sign up

**Highest-impact decision:** redirect or remove `/profile*` stubs and fix admin header → `/account`, **or** wire hub/settings to real data. Do not leave dummy identity linked in production chrome.
