# Client Flow — Log Out & Idle Timeout

**Scope:** Logged-in customer `flow.md` bullet: log out (idle timeout) — manual Navbar logout + idle session watcher.  
**Out of scope:** Admin panel idle quirks beyond shared watcher (Admin Auth Session); forgot-password / signup (Guest Sign up); full auth `is_active` gaps (reference only).

**Verdict:** **Works.** Same `IdleSessionWatcher` / `logoutService` as admin. User password login defaults to **`/`**. Idle (10 min, warning at 8m) → **`/auth/login?reason=idle`** (banner); manual Navbar logout → **`/`**. Destination asymmetry is intentional.

---

## Happy path (what works today)

1. Any signed-in user → `AuthProvider` mounts `IdleSessionWatcher` (`enabled={Boolean(user)}`).
2. Idle = **10 min** (`IDLE_TIMEOUT_MS`) without `pointerdown` / `keydown` / `scroll` / `touchstart` or pathname change (no `mousemove`); becoming **visible** resets (hidden tab time does not accumulate). Warning toast at **8 min** (`IDLE_WARNING_BEFORE_MS`).
3. Idle → `logoutService` → toast “Session expired…” → **`/auth/login?reason=idle`** + refresh (login banner).
4. Manual Navbar logout → `logoutService` → toast → **`/`** + refresh.
5. User password login (no `?redirect`) → **`/`** (`LoginForm`; admin → `/admin`).

```text
Signed-in user
  → AuthProvider + IdleSessionWatcher (10m, warn @8m)
  → idle → logoutService → /auth/login?reason=idle
  → Navbar logout → logoutService → /
  → password login → /  (or safe ?redirect=)
```

---

## Capability checklist

| Capability | Status | Notes |
|------------|--------|--------|
| Manual logout | Yes | Navbar → `/` |
| Idle logout | Yes | Warn @8m; 10 min → `/auth/login?reason=idle` |
| Idle applies on storefront | Yes | Any `user`, not role-gated |
| User login landing | `/` | vs admin `/admin` |

---

## P0 — Correctness (fix first)

_None verified that block logout or idle sign-out for an authenticated customer._

Shared auth P0s (`is_active` ignored on login, etc.) → Guest Sign up / Admin Auth Session — not specific to this bullet’s happy path.

---

## P1 — Incomplete / wrong logout behavior

- [x] ✅ **Idle → login vs manual → `/`** done✅  
  Intentional but confusing when documenting “session expired.”  
  **Where:** `IdleSessionWatcher.tsx` vs `Navbar.tsx`.  
  **Do:** Align destinations, or idle with `?reason=idle` banner (login banners already support `reason` for inactive).  
  **Done:** Idle keeps `/auth/login`; redirects with `?reason=idle`; `getLoginAuthBannerMessage` shows inactivity message. Manual logout still → `/`.

---

## P2 — DX / polish

- [x] ✅ **No user-specific idle policy** done✅ — same 10m; no `mousemove`; long read-only stare expires.  
  **Where:** `hooks/use-idle-timeout.ts`; `lib/constants/session.ts`; `IdleSessionWatcher.tsx`.  
  **Do:** Document; optional warning toast before logout.  
  **Done:** Shared watcher warns at 8m (`IDLE_WARNING_BEFORE_MS`); logout at 10m. Activity events / visibility reset documented.

- [x] ✅ **Orphan `LogoutButton`** done✅ — Navbar inlines `logoutService`.  
  **Where:** `components/auth/LogoutButton.tsx`.  
  **Do:** Wire or remove.  
  **Done:** Component removed; Navbar / admin header / idle watcher use `logoutService`.

---

## Deferred / works-as-implemented

| Behavior | Why OK |
|----------|--------|
| Shared `logoutService` for user & admin | One session model |
| Idle for any `user` | Includes customers |
| User default login `/` | Matches `flow.md` User |
| Tab hidden >10m then focused | Timer resets; no immediate logout |
| `?redirect=` on login | `safeRedirectPath` |

---

## Edge-case matrix

| Case | Status |
|------|--------|
| User idle 8m | Warning toast |
| User idle 10m | Logout → `/auth/login?reason=idle` |
| Manual Navbar logout | → `/` |
| User login no redirect | → `/` |
| User login `?redirect=/orders` | Safe path |
| Tab hidden then visible | Reset; no fire |
| No scroll/click 8m / 10m | Warning then idle fires |
| Guest (no user) | Watcher disabled |
| Admin idle/logout | Same watcher; see Admin Auth Session |

---

## User vs Admin (session landings)

| | User | Admin |
|--|------|--------|
| Default password login | `/` | `/admin` |
| Idle landing | `/auth/login?reason=idle` | `/auth/login?reason=idle` |
| Manual logout landing | `/` | `/` (header/Navbar) |
| Idle duration | 10 min (warn @8m) | 10 min (same) |

---

## Key file map

| Concern | Path |
|---------|------|
| Idle | `IdleSessionWatcher.tsx`, `hooks/use-idle-timeout.ts`, `lib/constants/session.ts` (`IDLE_TIMEOUT_MS`, `IDLE_WARNING_BEFORE_MS`) |
| Provider | `providers/AuthProvider.tsx` |
| Logout | `services/auth.service.ts` (`logoutService`), `Navbar.tsx` |
| Login landing | `LoginForm.tsx` |
| Login banners | `lib/auth/login-banner.ts` |

---

## Related docs

- Index: `flow.md` (User → Log out idle timeout)
- Admin panel session: `[04] Admin Flows/[09] Admin Flow - Auth Session.md`
- Shared auth gaps: `[02] Guest Flow/[05] Guest Flow - Sign up Log in.md`
- Guest capabilities inheritance: `[02] Client Flow - Guest Capabilities.md`

**Highest-impact remaining:** none for this bullet; idle vs manual destinations stay intentional with `?reason=idle` banner.
