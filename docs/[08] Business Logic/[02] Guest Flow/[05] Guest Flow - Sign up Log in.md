# Guest Flow — Sign up / Log in

**Scope:** Guest → sign up / log in / log out / auth callback / guest cart merge / middleware redirects.  
**OAuth / social login:** deferred (listed at the end, not a “broken today” bug).

**Verdict:** Not all good. Password login, logout, and guest **cart** merge on client `SIGNED_IN` work. Correctness gaps remain (profile auto-create not in migrations; inactive users can still authenticate; admin gates ignore `is_active`). Incomplete features and DX issues — use the checklists below to fix.

---

## Happy path (what works today)

1. Guest browses storefront → middleware mints HttpOnly `guest_session_id` (UUID, 14d).
2. Optional: add to cart / wishlist under that session.
3. **Sign up** (`/auth/signup` → `SignupForm` → `signupService` → `signUp`) with `full_name` metadata + `emailRedirectTo` → `/auth/callback`.
4. If email confirm **on**: “Check your email” UI; click link → callback `exchangeCodeForSession` → session cookies → redirect.
5. If email confirm **off**: session created → toast → `/` + refresh; `AuthProvider` gets `SIGNED_IN` → `mergeGuestCartOnLoginAction`.
6. **Log in** (`/auth/login` → `LoginForm` → `loginService` → `signInWithPassword`) → role from `profiles` → redirect (`?redirect=` via `safeRedirectPath`, else admin → `/admin`, else `/`).
7. On `SIGNED_IN`: claim guest orders → merge guest cart → clear `guest_session_id` (only on full success) → revalidate `/cart` + `/orders`.
8. **Log out** (Navbar / admin header / idle watcher → `logoutService`) → home + refresh (idle → login).
9. Active logged-in users hitting `/auth/login` or `/auth/signup` are redirected away by middleware.

```text
Guest (guest_session_id)
  → /auth/signup OR /auth/login
  → signupService / loginService (browser Supabase cookies)
  → [email confirm?] callback exchangeCodeForSession
  → AuthProvider SIGNED_IN → mergeGuestCartOnLoginAction
       → claimGuestOrdersService → mergeGuestCartToUserService
       → clearGuestSessionCookie (only if both succeed)
  → HOME or ADMIN (or safe ?redirect=)
  → logout / idle → signOut → HOME (idle → LOGIN)
```

---

## P0 — Correctness (fix first)

- [ ] **Profile not auto-created in migrations**  
  Phase docs require `handle_new_user` + `on_auth_user_created` on `auth.users`. That SQL is **not** in `supabase/migrations/`. Profiles RLS has SELECT/UPDATE only (no INSERT for users). Public signup only calls `supabase.auth.signUp`; it never inserts `profiles`. Admin create / `seed-admin` insert via service role and optionally tolerate a pre-existing row. Fresh DB from migrations → auth user with **no** profile → middleware treats as unauthenticated for `/account`; role null on login.  
  **Where:** `docs/[05] Phases/phase_2/fragment 2.1/`; `supabase/migrations/`; `services/auth.service.ts`; `repositories/profile.repository.ts` (`createUserAndProfile`).  
  **Do:** Add migration for `security definer` trigger reading `raw_user_meta_data->>'full_name'`, or create profile in app after signup with a privileged path.

- [ ] **Inactive users can still log in; admin ignores `is_active`**  
  Intended: “User deactivation prevents login.” `loginService` never reads `is_active`. Middleware blocks inactive on `/account` and `/profile` (`reason=inactive`) but **`/admin` and `/api/admin` only check role**, not `is_active`. `requireAdmin` also skips `is_active`. Deactivated customer still gets a session + storefront; deactivated admin still reaches admin UI/APIs.  
  **Where:** `services/auth.service.ts`; `middleware.ts` (account ~152–157 vs admin ~185–202); `lib/auth/require-admin.ts`.  
  **Do:** After successful password sign-in (and in middleware/admin gates), if `!profile.is_active` → sign out + show inactive message; apply same check on `/admin` and `requireAdmin`.

---

## P1 — Incomplete auth features

- [ ] **Forgot password is a dead link**  
  `LoginForm` links to `ROUTES.RESET_PASSWORD` (`/auth/reset-password`). Constants also define `/auth/reset-password/confirm`. **No** `app/(public)/auth/reset-password` pages. Logged-in change-password exists (`ChangePasswordForm` via account dialog).  
  **Where:** `components/auth/LoginForm.tsx`; `lib/constants/routes.ts`; missing pages under `app/(public)/auth/`.  
  **Do:** Implement reset request + confirm (Supabase recovery) or remove the link until ready.

- [ ] **Guest wishlist not merged or claimed on login**  
  Cart merges and guest orders are claimed on `SIGNED_IN`. Guest wishlist rows stay on old `session_id`; after cookie clear, `/wishlist` shows **user** list only.  
  **Where:** `providers/AuthProvider.tsx`; `actions/cart.ts` (`mergeGuestCartOnLoginAction`); wishlist services (no merge).  
  **Do:** Merge/claim wishlist before clearing cookie; or clear cookie only after all handoffs.

- [ ] **Cart merge may not run after email-confirm callback**  
  Merge runs only on `onAuthStateChange` event `SIGNED_IN`. Password login fires that. Callback sets session via cookies then full navigation; typical event is `INITIAL_SESSION` (supabase-js 2.x), which is **not** handled for merge. Guest cart can remain unmerged after confirm-email.  
  **Where:** `providers/AuthProvider.tsx`; `app/(public)/auth/callback/route.ts`.  
  **Do:** Also call merge on first authenticated session after load (or from callback after exchange), idempotently.

- [ ] **Auth callback admin redirect likely ineffective**  
  After `exchangeCodeForSession`, cookies are written onto the **redirect `NextResponse`**, then `getCurrentUserProfile()` uses the Server Component client reading **request** `cookies()` — not those new cookies. Admin check often fails silently → user lands on `next`/HOME. Password login admin redirect in `LoginForm` is fine.  
  **Where:** `app/(public)/auth/callback/route.ts`; `services/profile.service.ts` → `getCurrentAuthUserFromComponent`.  
  **Do:** Resolve role with the same Supabase client that just exchanged the code (or read profile via that session).

- [ ] **Login UI ignores `reason=inactive` and `error=auth_callback_error`**  
  Middleware / callback set query params; `LoginForm` never reads them → user sees a blank login form with no explanation.  
  **Where:** `middleware.ts`; `app/(public)/auth/callback/route.ts`; `components/auth/LoginForm.tsx`.  
  **Do:** Show banners for inactive / callback failure.

- [x] ✅ **Failed cart merge still clears guest cookie** done✅  
  Comment is intentional; failed merge cannot be retried with the same session id.  
  **Where:** `actions/cart.ts` (`mergeGuestCartOnLoginAction` ~64–65).  
  **Do:** Clear cookie only on successful merge (or when there was no guest cart).  
  **Done:** Cookie cleared only after `claimGuestOrdersService` and `mergeGuestCartToUserService` both succeed; AuthProvider can retry with the same guest session.

---

## P2 — DX / dead / stale

- [ ] **`LogoutButton` unused**  
  Navbar / admin header / idle watcher call `logoutService` directly. `actions/auth.ts` `logout` server action also unused by UI.  
  **Where:** `components/auth/LogoutButton.tsx`; `actions/auth.ts`; `components/common/Navbar.tsx`.  
  **Do:** Wire one logout path or delete dead exports.

- [ ] **Stale auth docs**  
  `docs/[03] Bedrock/AUTHENTICATION_EXPLANATION.md` still mentions `@supabase/auth-helpers-nextjs` and layout initial profile; app uses `@supabase/ssr` and `AuthProvider` without relying on `initialProfile`. Phase checklist still lists `/auth/register`, password reset, OAuth.  
  **Where:** docs under `docs/[03]`, `docs/[05] Phases/01_main_plan.md`.  
  **Do:** Align docs with `login` / `signup` + current clients.

- [ ] **Signup password UX stricter than Zod**  
  UI strength meter pushes uppercase / number / special; `signupSchema` only requires length ≥ 8. Weak passwords still submit.  
  **Where:** `components/auth/SignupForm.tsx`; `lib/validators/auth/auth.ts`.  
  **Do:** Align schema with displayed rules if those are required.

---

## Deferred (not bugs — planned later)

- [ ] OAuth / social login (`signInWithOAuth`; callback exists mainly for email links)
- [ ] Full forgot-password product (until pages exist, treat link as incomplete — see P1)
- [ ] Claiming historical guest orders by email match (product decision; same-session claim on login is done)

---

## Works as implemented (not bugs)

| Area | Notes |
|------|--------|
| Login / signup pages + layout | Thin pages; forms + `AuthLayout` |
| Duplicate email / unconfirmed email messaging | Mapped in `signupService` / `loginService` |
| Email-confirm UX | `requiresEmailVerification` + check-email screen |
| `safeRedirectPath` | Blocks open redirects; covered by unit tests |
| Guest cookie mint / validate / clear | Middleware + `lib/auth/guest-session.ts`; unit tests |
| Cart merge scenarios | `mergeGuestCartToUserService` four cases |
| Active user blocked from login / signup | Middleware `isAuthEntryPage` |
| Guest cookie on auth entry | `ensureGuestSessionCookie` on those routes |
| Idle timeout | `IdleSessionWatcher` + `IDLE_TIMEOUT_MS` = 10m |
| Logged-in change password | Account `ChangePasswordForm` |

---

## DB tables in this flow

| Table | Role |
|-------|------|
| `auth.users` | Supabase Auth identity |
| `profiles` | `role`, `full_name`, `is_active`; expected on signup |
| `carts` / `cart_items` | Guest `session_id` → merge into `user_id` cart |
| `wishlists` | Guest vs user; **no** merge on login |
| `orders` | Guest `session_id` + `user_id IS NULL`; claimed onto `user_id` on login |


---

## Guest vs authenticated (auth-related)

| | Auth | Guest |
|--|------|--------|
| Session | Supabase cookies | `guest_session_id` HttpOnly |
| Cart | `user_id` (+ merge on `SIGNED_IN`) | `session_id` |
| Wishlist | `user_id` | `session_id` (orphaned if cookie cleared) |
| Orders list | by `user_id` | by `session_id` (lost after cookie clear) |
| `/account`, `/profile` | active profile required | → login |
| `/admin` | `role === admin` (**no** `is_active`) | → login |
| Login / signup pages | active users redirected | allowed (+ guest cookie kept) |

---

## Key file map

- UI: `app/(public)/auth/{login,signup}/page.tsx`, `callback/route.ts`, `layout.tsx`, `components/auth/*`
- Client auth: `services/auth.service.ts`, `repositories/auth.client.repository.ts`
- Session / merge: `providers/AuthProvider.tsx`, `actions/cart.ts`, `lib/auth/guest-session.ts`
- Gates: `middleware.ts`, `lib/auth/{safe-redirect,permissions,require-admin}.ts`
- Profile API: `app/api/auth/profile/route.ts`
