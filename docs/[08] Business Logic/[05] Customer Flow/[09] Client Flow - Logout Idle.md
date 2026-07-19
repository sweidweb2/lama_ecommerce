# Client Flow — Log Out & Idle Timeout

**Scope:** Logged-in customer `flow.md` bullet: log out (idle timeout) — manual Navbar logout + idle session watcher.  
**Out of scope:** Admin panel idle quirks beyond shared watcher (Admin Auth Session); forgot-password / signup (Guest Sign up); full auth `is_active` gaps (reference only).

**Verdict:** **Works.** Same `IdleSessionWatcher` / `logoutService` as admin. User password login defaults to **`/`**. Idle (10 min) → **`/auth/login`**; manual Navbar logout → **`/`**. Document destination asymmetry; no capability denial.

---

## Happy path (what works today)

1. Any signed-in user → `AuthProvider` mounts `IdleSessionWatcher` (`enabled={Boolean(user)}`).
2. Idle = **10 min** (`IDLE_TIMEOUT_MS`) without `pointerdown` / `keydown` / `scroll` / `touchstart` or pathname change; becoming **visible** resets (hidden tab time does not accumulate).
3. Idle → `logoutService` → toast “Session expired…” → **`/auth/login`** + refresh.
4. Manual Navbar logout → `logoutService` → toast → **`/`** + refresh.
5. User password login (no `?redirect`) → **`/`** (`LoginForm`; admin → `/admin`).

```text
Signed-in user
  → AuthProvider + IdleSessionWatcher (10m)
  → idle → logoutService → /auth/login
  → Navbar logout → logoutService → /
  → password login → /  (or safe ?redirect=)
```

---

## Capability checklist

| Capability | Status | Notes |
|------------|--------|--------|
| Manual logout | Yes | Navbar → `/` |
| Idle logout | Yes | 10 min → `/auth/login` |
| Idle applies on storefront | Yes | Any `user`, not role-gated |
| User login landing | `/` | vs admin `/admin` |

---

## P0 — Correctness (fix first)

_None verified that block logout or idle sign-out for an authenticated customer._

Shared auth P0s (`is_active` ignored on login, etc.) → Guest Sign up / Admin Auth Session — not specific to this bullet’s happy path.

---

## P1 — Incomplete / wrong logout behavior

- [ ] **Idle → login vs manual → `/`**  
  Intentional but confusing when documenting “session expired.”  
  **Where:** `IdleSessionWatcher.tsx` vs `Navbar.tsx`.  
  **Do:** Align destinations, or idle with `?reason=idle` banner (login banners already support `reason` for inactive).

---

## P2 — DX / polish

- [ ] **No user-specific idle policy** — same 10m; no `mousemove`; long read-only stare expires.  
  **Where:** `hooks/use-idle-timeout.ts`; `lib/constants/session.ts`.  
  **Do:** Document; optional warning toast before logout.

- [ ] **Orphan `LogoutButton`** — Navbar inlines `logoutService`.  
  **Where:** `components/auth/LogoutButton.tsx`.  
  **Do:** Wire or remove.

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
| User idle 10m | Logout → `/auth/login` |
| Manual Navbar logout | → `/` |
| User login no redirect | → `/` |
| User login `?redirect=/orders` | Safe path |
| Tab hidden then visible | Reset; no fire |
| No scroll/click 10m | Idle fires |
| Guest (no user) | Watcher disabled |
| Admin idle/logout | Same watcher; see Admin Auth Session |

---

## User vs Admin (session landings)

| | User | Admin |
|--|------|--------|
| Default password login | `/` | `/admin` |
| Idle landing | `/auth/login` | `/auth/login` |
| Manual logout landing | `/` | `/` (header/Navbar) |
| Idle duration | 10 min | 10 min |

---

## Key file map

| Concern | Path |
|---------|------|
| Idle | `IdleSessionWatcher.tsx`, `hooks/use-idle-timeout.ts`, `lib/constants/session.ts` |
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

**Highest-impact remaining:** optional idle vs manual destination alignment / `?reason=idle`; otherwise this goal is satisfied.
