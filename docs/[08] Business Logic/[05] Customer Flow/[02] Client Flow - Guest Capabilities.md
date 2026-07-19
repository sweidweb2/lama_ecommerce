# Client Flow — All Guest Capabilities (Login Merge)

**Scope:** Logged-in customer (`profiles.role = user`) inheriting Guest capabilities from `flow.md`, plus **cart merge / order claim on login** (`AuthProvider` → `mergeGuestCartOnLoginAction`).  
**Out of scope:** Account profile / password / addresses, profile settings, reviews, User-only wishlist polish — later Customer Flow bullets. Shared browse/buying/wishlist/contact/newsletter bugs stay in Guest Flow docs unless behavior differs when authenticated.

**Verdict:** The claim **holds for shopping identity**. Middleware does not lock users out of guest storefront routes; ATC / cart / checkout / wishlist / contact / newsletter / static pages key off auth presence (`user_id`) or stay public — never `role === user`. Password login defaults to **`/`**. Cart merge + guest-order claim on `SIGNED_IN` work (cookie cleared only on full success). Login handoff is **incomplete for wishlist** (still no merge; cookie clear orphans guest hearts). `/orders` list ignores the guest cookie while auth (unlike order details).

---

## Happy path (what works today)

1. Guest browses / ATC / wishlists / optionally places a guest order (`guest_session_id` cookie).
2. User signs in (`/auth/login` → `LoginForm` → `loginService`) → default redirect **`/`** (or `?redirect=` via `safeRedirectPath`).
3. `AuthProvider` on `SIGNED_IN` → `mergeGuestCartOnLoginAction`:
   - claim guest orders (`session_id` → `user_id`)
   - merge guest cart into user cart
   - clear `guest_session_id` **only if both succeed**
4. Storefront continues on auth path: ATC / qty / checkout use `user.id` → `process_checkout` with `p_user_id`.
5. `/orders` + `/order_details/[id]` show **own** orders by `user_id`; details still allow guest-cookie fallback for **unclaimed** guest rows.
6. Wishlist toggle/list uses `user_id` — guest rows from before login are **not** transferred.
7. Contact / newsletter / static pages remain public (no role gate).
8. Re-open `/auth/login` or `/auth/signup` while active → middleware redirects to **`/`**.
9. Idle logout (10 min) via `IdleSessionWatcher` → `/auth/login`.

```text
Guest session (cookie)
  → /auth/login (user)
  → default HOME  (or ?redirect=…)
  → AuthProvider SIGNED_IN
       → claimGuestOrdersService
       → mergeGuestCartToUserService
       → clearGuestSessionCookie (full success only)
  → browse / ATC / checkout / wishlist (user_id)
  → /orders + /order_details (own; guest cookie fallback on details)
  → contact / newsletter / static (public)
  → IdleSessionWatcher → LOGIN
```

---

## Capability checklist (Guest → User)

| Guest capability | User status | Notes |
|------------------|-------------|--------|
| Browse home / catalog / search / PDP | Yes | Public routes; no role check. Shared Guest Browse gaps apply. |
| Add / update cart / checkout | Yes (auth path) | `user.id`; `session_id` null when auth. See Client Buying. |
| Wishlist add/remove | Yes (auth path) | Same UI; **no merge on login**. Shared Guest Wishlist gaps apply. |
| View order details (guest path) | Mostly yes | Claim-on-login attaches guest orders. Details: auth **or** cookie fallthrough. `/orders` list: **auth only**. |
| Sign up / log in | N/A → redirect | Active session → middleware → `HOME`. |
| Contact us submit | Yes | Public action; no auth/role gate. |
| Newsletter / lead signup | Yes | Public; may attach `user?.id` when logged in. |
| Read static pages | Yes | about / terms / privacy / shipping terms. |
| **Cart merge on login** | Yes | `mergeGuestCartOnLoginAction` |
| **Order claim on login** | Yes | Before cart merge; cookie cleared only after both OK |
| **Wishlist merge on login** | No | Guest Wishlist / Sign up gap |

---

## P0 — Correctness (fix first)

- [ ] **Guest wishlist still not merged on login**  
  Cart + orders are claimed; wishlist is not. Success path **clears** `guest_session_id` → middleware remints a **new** cookie → guest hearts under the old `session_id` are orphaned; `/wishlist` shows user list only.  
  **Where:** `providers/AuthProvider.tsx`; `actions/cart.ts` (`mergeGuestCartOnLoginAction`); no `mergeGuestWishlist*` in wishlist service/repo.  
  **Do:** Claim/upsert guest wishlist rows into `user_id` before clearing cookie (same order as orders → cart).  
  **Also tracked:** `[02] Guest Flow/[06] Guest Flow - Wishlist.md`, `[05] Guest Flow - Sign up Log in.md`.

_No other User-only P0 that denies guest shopping capabilities._ Shared auth P0s (`is_active` ignored on login, profile trigger, etc.) → Guest Sign up.

---

## P1 — Incomplete / wrong User handoff

- [ ] **`/orders` ignores guest cookie while authenticated**  
  `order_details` always reads cookie and falls through for unclaimed guest orders; `/orders` only calls `getUserOrders(user.id)`. After login, before claim finishes (or if claim fails), list can omit guest orders that detail URLs still open.  
  **Where:** `app/(public)/orders/page.tsx` vs `app/(public)/order_details/[id]/page.tsx` + `getOrderDetails`.  
  **Do:** Union session orders (unclaimed) with user orders while cookie present, or wait for claim / surface merge-failure toast.

- [ ] **Cart/order merge may skip after email-confirm callback**  
  Merge listens only for `SIGNED_IN`. Password login fires it; confirm-email callback often yields `INITIAL_SESSION` only → guest cart/orders can remain unmerged.  
  **Where:** `providers/AuthProvider.tsx`; `app/(public)/auth/callback/route.ts`.  
  **Do:** Idempotent merge on first authenticated session (see Guest Sign up **Do:**).

---

## P2 — DX / UX

- [ ] **Merge failure toast; retry depends on cookie retention**  
  AuthProvider toasts on failure; cookie kept (good). User may not know to refresh/retry.  
  **Where:** `providers/AuthProvider.tsx`.  
  **Do:** Optional retry CTA or run merge once from cart/`/orders` when cookie + auth coexist.

- [ ] **Claim-then-merge partial success messaging**  
  If claim succeeds and merge fails, orders are already on `user_id`, cookie kept for cart retry (idempotent claim). Messaging may say “cart or orders” generically.  
  **Where:** `actions/cart.ts`; `tests/feature/merge-guest-on-login.test.ts`.  
  **Do:** Split toast copy, or treat claim-only as partial success UI.

---

## Deferred / works-as-implemented

| Behavior | Why OK |
|----------|--------|
| Auth ATC / checkout by `user_id` | Intended vs guest `session_id` |
| Cookie cleared only after claim + merge succeed | Fixed (Guest Sign up) |
| Login default → `/` for users | Matches `flow.md` User (vs admin `/admin`) |
| Auth-entry redirect → `/` while logged in | Middleware |
| Idle logout 10 min | Shared with Admin |
| Shared browse/buying/contact/newsletter issues | Guest Flow docs |
| Account / reviews / addresses | Later Customer Flow bullets |

---

## Edge-case matrix (login merge)

| Edge case | Status |
|-----------|--------|
| Guest ATC → user password login | Works — claim + merge + clear cookie |
| Guest checkout → login | Works — orders claimed; details by ownership |
| Guest wishlist → login | **Gap** — no merge; hearts orphaned after cookie clear |
| Both user + guest carts | Works — items moved; guest cart deleted |
| Guest cart only (no user cart) | Works — creates user cart, moves items |
| No guest cookie | Early success `merged: false` |
| Claim fails | No merge, cookie kept, toast |
| Merge fails after claim | Cookie kept; claim idempotent on retry |
| Login with `?redirect=/cart` | Works — `safeRedirectPath` |
| Login without redirect (role=user) | Lands **`/`** |
| Hit `/auth/login` while logged-in user + active | Redirect **`/`** |
| Guest routes while logged in | Open — no bounce to account |
| Inactive user on `/account`/`/profile` | Blocked `reason=inactive` |
| Inactive user on storefront | Can still shop today (shared Guest Sign up gap) |
| Auth + unclaimed guest order URL + matching cookie | Works — details fallthrough |
| Auth `/orders` + unclaimed guest orders + cookie | **Does not list** guest rows |
| Email-confirm then land HOME | Merge may **not** run (`INITIAL_SESSION`) |
| Idle 10 min | Logout → `/auth/login` |
| `role === user` gate blocking ATC/wishlist/checkout | **None found** |

---

## User vs Guest vs Admin (storefront)

| | Guest | User | Admin (storefront) |
|--|-------|------|---------------------|
| Browse / buy / wishlist / contact / newsletter / static | Yes | Yes | Yes |
| Cart owner | `session_id` | `user_id` | `user_id` |
| Cart merge + order claim on login | — | Yes | Yes |
| Wishlist merge on login | — | **No** | **No** |
| Default password login | — | **`/`** | **`/admin`** |
| Re-open login while active | — | → `/` | → `/admin` |
| Idle logout | — | 10 min | 10 min |

---

## Key file map

| Concern | Path |
|---------|------|
| Route gates | `middleware.ts` |
| Login redirect (user → HOME) | `components/auth/LoginForm.tsx` |
| Session + merge + idle | `providers/AuthProvider.tsx`, `IdleSessionWatcher.tsx`, `lib/constants/session.ts` |
| Merge / claim action | `actions/cart.ts` (`mergeGuestCartOnLoginAction`) |
| Cart merge service | `services/cart.service.ts` (`mergeGuestCartToUserService`) |
| Order claim | `services/order.service.ts` / `repositories/order.repository.ts` |
| Checkout auth path | `actions/checkout.ts`, `services/checkout.service.ts` |
| Wishlist auth (no merge) | `actions/wishlist.ts`, `services/wishlist.service.ts` |
| Orders list vs details | `app/(public)/orders/page.tsx`, `order_details/[id]/page.tsx` |
| Guest cookie | `lib/auth/guest-session.ts`, middleware mint |
| Merge tests | `tests/feature/merge-guest-on-login.test.ts` |

---

## Related docs

- Index: `docs/[08] Business Logic/flow.md` (User → All guest capabilities…)
- Guest capabilities: `[02] Guest Flow/` (Browse, Buying, Wishlist, Contact, Newsletter, Sign up, Order Details)
- Authenticated buying detail: `[05] Customer Flow/[01] Client Flow - Buying.md`
- Admin inheritance mirror: `[04] Admin Flows/[01] Admin Flow - Storefront User Capabilities.md`

**Highest-impact remaining:** wishlist merge before cookie clear → `/orders` union or wait-for-claim → merge on email-confirm / `INITIAL_SESSION`.
