# Admin Flow — Auth Session

**Scope:** Admin `flow.md` bullet: log out (idle timeout); login/signup redirect into `/admin`. Panel session lifecycle: enter `/admin`, stay signed in, idle/manual logout, re-entry.  
**Out of scope:** Full guest signup/login correctness (profile trigger, wishlist merge, reset password) — see Guest Sign up. Shop-as-admin capability — see Storefront User Capabilities.

**Verdict:** Password login → `/admin`, middleware bounce from login/signup → `/admin`, and idle/manual logout **work**. Same 10-minute idle path as User. Remaining issues are mostly **shared auth gaps** (`is_active`, callback cookie timing) plus small UX differences (idle → login vs manual logout → home).

---

## Happy path (what works today)

1. Admin → `/auth/login` → `LoginForm` → `loginService` → role `admin` → **`ROUTES.ADMIN`** (`/admin`) unless safe `?redirect=`.
2. Middleware allows `/admin` when session + `profiles.role === admin`.
3. `AuthProvider` mounts `IdleSessionWatcher` (`enabled={Boolean(user)}`) — **10 min** (`IDLE_TIMEOUT_MS`).
4. Activity = `pointerdown` / `keydown` / `scroll` / `touchstart` + pathname change; becoming visible again **resets** the timer (background time does not accumulate).
5. Idle → `logoutService` → toast “Session expired…” → **`/auth/login`** + refresh.
6. Manual logout (admin header / storefront Navbar) → `logoutService` → toast → **`/`** + refresh.
7. Active admin revisits `/auth/login` or `/auth/signup` → middleware redirects to **`/admin`**.
8. Public signup does **not** create admins (`SignupForm` → HOME). Admin role is seed / admin-create only.

```text
/auth/login (admin)
  → loginService → role admin → /admin  (or safe ?redirect=)
  → AuthProvider + IdleSessionWatcher (10m, all signed-in roles)
  → idle → logoutService → /auth/login
  → header/Navbar logout → logoutService → /
  → hit /auth/login|/auth/signup while active admin → middleware → /admin
  → /auth/callback admin→/admin: intended but often broken (cookie timing)
```

---

## P0 — Correctness (fix first)

- [x] ✅ **`/admin` and `/api/admin` ignore `is_active`** done✅  
  Deactivated admin still reaches panel/APIs. `/account` and `/profile` are blocked; auth-entry redirect also requires `is_active`, so inactive admin can sit on login with a live session and still open `/admin` by URL.  
  **Where:** `middleware.ts` (`/admin`, `/api/admin`); `lib/auth/require-admin.ts`; `lib/auth/permissions.ts`.  
  **Do:** Gate admin routes/APIs/`requireAdmin` on `is_active === true`; force sign-out + inactive message on login.  
  **Also tracked:** Guest Sign up P0; Customers / Dashboard / Catalog docs.  
  **Done:** Middleware rejects inactive on `/admin` + `/api/admin`; `requireAdmin` requires `is_active`; `loginService` signs out inactive profiles.

---

## P1 — Incomplete / wrong panel session behavior

- [x] ✅ **Auth callback admin → `/admin` often fails** done✅  
  After `exchangeCodeForSession`, cookies are on the redirect response; `getCurrentUserProfile()` reads request cookies → often misses session → lands on `next`/HOME. Password login redirect is reliable.  
  **Where:** `app/(public)/auth/callback/route.ts`.  
  **Do:** Resolve role with the exchange client (Guest Sign up **Do:**).  
  **Done:** `getUser` + `getProfileByUserIdAdmin` after exchange; cookies preserved on admin redirect.

- [ ] **Idle vs manual logout destinations differ**  
  Idle → `/auth/login`; header/Navbar → `/`. Fine if intentional; confusing when documenting session expiry.  
  **Where:** `IdleSessionWatcher.tsx` vs `components/admin/header.tsx` / `Navbar.tsx`.  
  **Do:** Align (e.g. both → login; idle with `?reason=idle`).

---

## P2 — DX / UX

- [ ] **No admin-specific idle policy**  
  Same 10m on panel and storefront. Long forms without scroll/click can expire. No `mousemove`. Hidden tab does not count as idle.  
  **Where:** `hooks/use-idle-timeout.ts`; `lib/constants/session.ts`.  
  **Do:** Document; optionally longer timeout on `/admin` or warn before logout.

- [ ] **Signup → `/admin` N/A**  
  `SignupForm` always HOME; middleware only redirects **already** logged-in active admins away from signup.  
  **Do:** Document “no public admin signup”; keep as-is.

- [ ] **Default post-login `/admin` friction for shopping** — already P2 in Storefront User Capabilities (reference only).

---

## Deferred / works-as-implemented

| Behavior | Why OK |
|----------|--------|
| Same `logoutService` for admin & user | Shared session |
| Login default admin → `/admin` | Matches `flow.md` |
| Middleware auth-entry → `/admin` for active admin | Works |
| `?redirect=` via `safeRedirectPath` | Open-redirect protected |
| Idle enabled for any `user`, not role-gated | Admin has a normal user session |
| Cart/order claim on admin `SIGNED_IN` | Storefront handoff; not a panel bug |
| OAuth / forgot-password | Deferred in Guest Sign up |
| Unused `LogoutButton` | Shared P2 |

---

## Edge-case matrix

| Edge case | Status |
|-----------|--------|
| Admin password login, no `redirect` | → `/admin` |
| Admin login `?redirect=/admin/orders` | → that path (safe) |
| Admin login `?redirect=https://evil` | Fallback HOME |
| Active admin opens `/auth/login` / `/auth/signup` | → `/admin` |
| Inactive admin opens `/admin` | **Still allowed** (P0) |
| Inactive admin opens `/auth/login` | Not bounced (needs `is_active`) |
| Non-admin opens `/admin` | → `/` |
| Idle 10m in `/admin` | Logout → `/auth/login` |
| Idle 10m on storefront as admin | Same |
| Manual logout from admin header | → `/` |
| Manual logout from Navbar | → `/` |
| Email-confirm callback as admin | Often **not** `/admin` (P1) |
| Public signup as “admin” | Creates user role (if profile); never panel |
| Tab hidden >10m then focused | Timer **resets**; no immediate logout |
| Read-only stare (no scroll/click) >10m | Idle fires |

---

## Admin vs User (session)

| | User | Admin |
|--|------|--------|
| Default password login | `/` | `/admin` |
| Auth-entry while logged in | → `/` | → `/admin` (if `is_active`) |
| Idle timeout | 10 min | 10 min (same watcher) |
| Idle landing | `/auth/login` | `/auth/login` |
| Manual logout landing | `/` | `/` |
| `/admin` access | Blocked | Role only (**not** `is_active` today) |

---

## Key file map

| Concern | Path |
|---------|------|
| Idle | `IdleSessionWatcher.tsx`, `hooks/use-idle-timeout.ts`, `lib/constants/session.ts` |
| Session context | `providers/AuthProvider.tsx` |
| Login redirect | `components/auth/LoginForm.tsx` |
| Signup | `components/auth/SignupForm.tsx` |
| Logout | `services/auth.service.ts` (`logoutService`), `components/admin/header.tsx`, `Navbar.tsx` |
| Gates | `middleware.ts`, `lib/auth/{permissions,require-admin,safe-redirect}.ts` |
| Callback | `app/(public)/auth/callback/route.ts` |
| Routes/roles | `lib/constants/{routes,roles}.ts` |
| Admin shell | `app/admin/layout.tsx` |

---

## Related docs

- Index: `flow.md` (Admin → Log out / login redirect)
- Storefront + default `/admin` UX: `[01] Admin Flow - Storefront User Capabilities.md`
- Shared auth gaps: `[02] Guest Flow/[05] Guest Flow - Sign up Log in.md`
- Inactive admin impact: `[05] Admin Flow - Customers.md`

**Highest-impact fix for this goal:** enforce `is_active` on `/admin` + `/api/admin` + `requireAdmin`. Password login → `/admin` and idle logout already satisfy the `flow.md` happy path.
