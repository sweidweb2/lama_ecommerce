# Admin Flow — Storefront User Capabilities

**Scope:** Admin (`profiles.role = admin`) exercising storefront / account capabilities that **User** has in `flow.md` (browse, cart, wishlist, checkout, orders, profile/account/addresses, reviews, contact/newsletter/static pages, logout / idle timeout).  
**Out of scope:** `/admin` panel modules (dashboard, catalog CRUD, sales ops, customers, engagement moderation, analytics, backups) — later `[02]+` Admin Flow docs. Admin-panel carts (`createCartForAdminService`) are noted only where they could be confused with the admin’s **personal** storefront cart.

**Verdict:** The claim holds. Middleware does **not** lock admins out of the storefront; cart, wishlist, checkout, orders, profile, account, and review-write paths key off auth identity (`user_id`), not `role === user`. No admin-specific P0 that denies shopping. Friction is **post-login default → `/admin`** and shared auth gaps already tracked under Guest Flow — Sign up / Log in (e.g. `is_active` ignored on `/admin` / `requireAdmin`). Shared browse/buying/wishlist bugs stay in Guest / Client Flow docs unless behavior differs by role (it does not).

---

## Happy path (what works today)

1. Admin signs in (`/auth/login` → `LoginForm` → `loginService`) → default redirect **`/admin`** (or `?redirect=` via `safeRedirectPath`).
2. Admin opens storefront (`/`, `/products`, `/search`, `/products/[slug]`) manually — same public browse as User/Guest; Navbar shows storefront chrome + **Admin Panel** link.
3. ATC / wishlist / cart updates use authenticated path (`user.id`) — no role gate.
4. Checkout → `checkoutAction` / `process_checkout` with `p_user_id` — same as any customer.
5. `/orders` + `/order_details/[id]` list/show **own** orders by `user_id` (guest cookie fallback still available for unclaimed guest rows).
6. `/account`, `/profile`, `/profile/setting` — middleware requires auth + **`is_active`** (same as User); addresses / password / profile edit use owner identity.
7. Write product review → `createReviewAction` → `createReviewService(user.id, …)` — auth only; moderation `requireAdmin` is separate.
8. Contact / newsletter / static pages — public; no role exclusion.
9. Idle logout (10 min) and Navbar logout apply on storefront **and** while working in `/admin`.
10. On `SIGNED_IN`, `mergeGuestCartOnLoginAction` claims guest orders + merges guest cart for the admin’s `user_id` (same handoff as User).

```text
/auth/login (admin)
  → default /admin  (or ?redirect=/cart|/ …)
  → manual nav to storefront
       → browse / search / PDP (public)
       → ATC / wishlist / cart (user_id)
       → checkout (process_checkout p_user_id)
       → /orders + /order_details (own user_id)
       → /account + /profile (auth + is_active)
       → createReviewAction (auth user_id)
  → IdleSessionWatcher / logout → login or home
```

---

## Capability checklist (vs `flow.md` User)

| User capability | Admin storefront? | Notes |
|-----------------|-------------------|--------|
| Browse home / catalog / search / PDP | Yes | Public routes; no role check |
| Add / update cart / checkout | Yes | `addItemToCartAction` / `checkoutAction` use `user.id` only |
| Wishlist add/remove (public + account) | Yes | Auth wishlist path; same list-remove gaps as User (see Guest Wishlist) |
| View own orders & order details | Yes | `getUserOrders` / `getOrderDetails` by `user_id` |
| Account: profile, password, addresses | Yes | `/account` + `/profile` allow any active authenticated profile |
| Write product reviews | Yes | Create path is auth-only; admin moderation is separate |
| Contact / newsletter / static pages | Yes | Public |
| Log out / idle timeout | Yes | `IdleSessionWatcher` for any signed-in user |
| Guest cart merge / order claim on login | Yes | Same `mergeGuestCartOnLoginAction` on `SIGNED_IN` |

---

## P0 — Correctness (fix first)

_None verified that block an active admin from using storefront user capabilities._

Shared auth correctness gaps (profile trigger, inactive login, admin panel ignoring `is_active`) are tracked in `[02] Guest Flow/[05] Guest Flow - Sign up Log in.md` — they are **not** “admin cannot shop” bugs. Deactivated admins are blocked from `/account` and `/profile` by middleware (same as User) but can still open `/admin` / `/api/admin` until that Guest doc item is fixed.

---

## P1 — Incomplete / wrong admin-as-shopper behavior

_None verified._ Storefront feature gaps that affect User also affect Admin the same way (wishlist list remove, guest wishlist merge, etc.) — see Guest / Client Flow docs; no admin-only divergence found.

---

## P2 — DX / UX (not capability denial)

- [ ] **Password login defaults to `/admin`, not the storefront**  
  Intended for panel operators, but “shop as admin” requires navigating to `/` (or `?redirect=/cart`). Re-opening `/auth/login` while already signed in also sends active admins to `/admin`.  
  **Where:** `components/auth/LoginForm.tsx` (role → `ROUTES.ADMIN`); `middleware.ts` auth-entry redirect (~97–98).  
  **Do:** Keep as-is (document), or add a storefront CTA post-login / optional “Continue shopping” when `redirect` is absent.

- [ ] **Auth callback admin → `/admin` often ineffective**  
  Same cookie-timing issue as Guest Sign up doc: after `exchangeCodeForSession`, `getCurrentUserProfile()` may not see new cookies → admin may land on `next`/HOME instead of `/admin`. Password login redirect is reliable. Does **not** block storefront use (opposite direction).  
  **Where:** `app/(public)/auth/callback/route.ts`.  
  **Do:** Resolve role with the exchange client (see Guest Sign up **Do:**).

---

## Deferred (not storefront bugs)

- [ ] `/admin` panel modules (dashboard, catalog, sales, customers, engagement, analytics, backups) — separate Admin Flow docs  
- [ ] Stripe / client pay UI — shared deferred buying work  
- [ ] Enforce `is_active` on `/admin` + `requireAdmin` — auth/admin-gate work (Guest Sign up P0); out of “shop as admin” claim  
- [ ] Admin-panel cart management (`createCartForAdminService`, admin checkout dialog) — ops tool for **other** users’/guests’ carts, not the admin’s personal storefront cart

---

## Works as implemented (not bugs)

| Behavior | Why OK |
|----------|--------|
| Middleware gates **into** `/admin`, not **out of** storefront | Matches `flow.md`: admin = all storefront user capabilities |
| `requireAdmin` on product/order/cart **admin** actions | Panel/ops only; storefront ATC/checkout do not call these |
| Navbar hides on `/admin`; shows Admin link on storefront | `ConditionalLayout` + `Navbar` `isAdmin` |
| Personal cart vs panel carts | Two systems by design: own `user_id` cart vs admin CRUD of arbitrary carts |
| Idle timeout 10 min everywhere | Same `IDLE_TIMEOUT_MS` for User and Admin |
| Admin’s own orders appear in `/orders` and can also appear in admin Sales | Expected dual view (owner vs operator) |

---

## Edge-case matrix (admin as shopper)

| Edge case | Status |
|-----------|--------|
| Admin opens `/`, `/cart`, `/wishlist`, `/orders` | Works — no redirect to `/admin` |
| Admin ATC while logged in | Works — `addItemToCartService(user.id, …)` |
| Admin checkout with saved addresses | Works — same auth checkout path as User |
| Admin writes a review on a product | Works — `createReviewAction` auth-only |
| Admin moderates reviews in panel vs writes as customer | Separate paths; write ≠ `requireAdmin` |
| Login with `?redirect=/cart` | Works — `safeRedirectPath` wins over default `/admin` |
| Login without redirect | Lands `/admin`; storefront still reachable by URL/nav |
| Hit `/auth/login` while already admin + active | Redirect `/admin` |
| Guest ATC then admin login | Works — claim orders + merge cart (same as User) |
| Guest wishlist then admin login | Same gap as User — no wishlist merge (Guest Wishlist P0) |
| Inactive admin (`is_active = false`) on `/account` / `/profile` | Blocked → login `reason=inactive` |
| Inactive admin on `/admin` | Still allowed today (shared Guest Sign up P0) |
| Admin edits another user’s cart in `/admin/carts` | Panel tool; does **not** replace personal storefront cart |
| Idle 10 min while browsing storefront | Logout → `/auth/login` |
| Idle 10 min while in `/admin` | Same logout |

---

## Admin vs User (storefront only)

| | User | Admin |
|--|------|--------|
| Browse / buy / wishlist / orders / reviews | Yes | Yes (same code paths) |
| `/account` / `/profile` | Auth + `is_active` | Auth + `is_active` |
| Default password login destination | `/` | `/admin` |
| Navbar “Admin Panel” link | No | Yes |
| Can open `/admin` | No (redirect home) | Yes (role check; **no** `is_active` today) |
| Panel cart / order management for others | No | Yes (separate Admin Flows) |
| Idle logout | 10 min | 10 min |

---

## Key file map

| Concern | Path |
|---------|------|
| Route gates | `middleware.ts` |
| Admin service gate | `lib/auth/require-admin.ts`, `lib/auth/permissions.ts` |
| Login redirect | `components/auth/LoginForm.tsx` |
| OAuth/email callback | `app/(public)/auth/callback/route.ts` |
| Session + merge + idle | `providers/AuthProvider.tsx`, `components/auth/IdleSessionWatcher.tsx`, `lib/constants/session.ts` |
| Storefront chrome | `components/layout/ConditionalMain.tsx`, `components/common/Navbar.tsx` |
| Cart / merge | `actions/cart.ts`, `services/cart.service.ts` |
| Checkout | `actions/checkout.ts`, `services/checkout.service.ts` |
| Wishlist | `actions/wishlist.ts` |
| Orders (own) | `services/order.service.ts` (`getUserOrders`, `getOrderDetails`) |
| Reviews (write) | `actions/review.ts`, `services/review.service.ts` (`createReviewService`) |
| Roles | `lib/constants/roles.ts` |

---

## DB / ownership (admin shopping)

| Table / mechanism | Admin-as-shopper |
|-------------------|------------------|
| `profiles.role` | `admin`; storefront features do not require `user` |
| `carts` / `cart_items` | Own cart by `user_id` (same as User) |
| `wishlists` | Own rows by `user_id` |
| `orders` / `order_items` | Own by `user_id`; claim-on-login for prior guest `session_id` |
| `reviews` | Insert as `user_id`; moderation is admin-gated separately |
| Admin panel cart ops | Service + `requireAdmin`; may touch **other** carts — not this flow |

---

## Related docs

- Index: `docs/[08] Business Logic/flow.md` (Admin → All storefront user capabilities)
- Shared browse / buying / wishlist / auth checklists: `docs/[08] Business Logic/[02] Guest Flow/`
- Authenticated buying: `docs/[08] Business Logic/[05] Customer Flow/[01] Client Flow - Buying.md`

**Highest-impact remaining (this goal):** none for capability denial. Optional UX: clearer path from post-login `/admin` back to shopping; finish shared auth `is_active` / callback items under Guest Sign up.
