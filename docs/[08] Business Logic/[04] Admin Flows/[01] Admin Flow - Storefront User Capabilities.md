# Admin Flow — Storefront User Capabilities

**Scope:** Admin (`profiles.role = admin`) on the public storefront / account vs customer shopping.  
**Out of scope:** `/admin` panel modules (dashboard, catalog, sales, customers, engagement, analytics, backups). Admin-panel carts (`createCartForAdminService`) are ops tools for **other** carts, not personal shopping.

**Verdict:** Admins may **browse** the catalog and use `/account` / `/profile`, but **cannot shop** (cart, wishlist, checkout, place orders, write reviews). Guest→admin login **never merges** guest cart/orders/wishlist — the guest cookie is cleared and guest rows stay unclaimed under that `session_id`.

---

## Happy path (current)

1. Admin signs in → default redirect **`/admin`**.
2. Admin may open storefront browse (`/`, `/products`, `/search`, PDP) — Navbar hides cart/wishlist; shows **Admin Panel**.
3. ATC / wishlist / checkout / review-create are rejected (`Admins cannot shop on the storefront`) at actions + services.
4. Middleware redirects signed-in admins from `/cart` and `/wishlist` to `/admin`.
5. `/account`, `/profile` remain available (auth + `is_active`).
6. On `SIGNED_IN` / auth callback, `performGuestSessionHandoff` detects admin → **clears `guest_session_id` only** (`skippedAsAdmin`); no claim/merge.

```text
/auth/login (admin)
  → /admin
  → optional browse /
       → catalog / PDP (OK; no ATC / wishlist UI)
       → /cart|/wishlist → redirect /admin
       → commerce mutations → rejected
  → guest cookie present at login → clear cookie, no merge
```

---

## Capability checklist (vs `flow.md` User)

| User capability | Admin storefront? | Notes |
|-----------------|-------------------|--------|
| Browse home / catalog / search / PDP | Yes | Public routes |
| Add / update cart / checkout | **No** | Actions + services + middleware |
| Wishlist add/remove | **No** | Actions + services + middleware |
| View own orders & order details | Yes (read) | Typically empty; no new storefront orders |
| Account: profile, password, addresses | Yes | Not blocked |
| Write product reviews | **No** | Create path blocked; moderation stays admin-gated |
| Contact / newsletter / static pages | Yes | Public |
| Log out / idle timeout | Yes | Unchanged |
| Guest cart merge / order claim on login | **No** | Cookie cleared; data left unclaimed |

---

## Enforcement layers

| Layer | Behavior |
|-------|----------|
| `lib/auth/permissions.ts` | `canShopAsCustomer`, `assertCanShopAsCustomer`, `ADMIN_CANNOT_SHOP_MESSAGE` |
| `lib/auth/require-customer-shop.ts` / `getAdminShopBlockForUserId` | Current-session and userId shop blocks |
| Actions | Cart mutations, checkout, wishlist toggle/remove, review create |
| Services | `addItemToCartService`, `checkoutService`, wishlist user mutations, `createReviewService`, claim/merge helpers |
| `performGuestSessionHandoff` | Admin → clear cookie, `skippedAsAdmin: true` |
| Middleware | `/cart`, `/wishlist` → `/admin` for active admin |
| UI | Navbar / floating cart / PDP ATC+wishlist / review form hidden or replaced for admin |

---

## Works as implemented (not bugs)

| Behavior | Why OK |
|----------|--------|
| Admins can still open `/` and PDPs | Browse-only by design |
| Admin panel cart CRUD | Ops tool; uses `requireAdmin`, not storefront shopping |
| Orphan guest rows after admin login | Intentional — no merge into admin identity |
| Default login → `/admin` | Operators land in the panel |

---

## Edge-case matrix

| Edge case | Status |
|-----------|--------|
| Admin opens `/cart` or `/wishlist` | Redirect → `/admin` |
| Admin ATC while logged in | Rejected |
| Admin checkout | Rejected |
| Admin writes a review | Rejected |
| Guest ATC then admin login | Cookie cleared; no claim/merge |
| Admin opens `/account` | Allowed |
| Inactive admin on `/account` | Blocked → login `reason=inactive` |

---

## Admin vs User (storefront only)

| | User | Admin |
|--|------|--------|
| Browse catalog | Yes | Yes |
| Buy / wishlist / review-write | Yes | **No** |
| `/account` / `/profile` | Auth + `is_active` | Auth + `is_active` |
| Guest handoff on login | Claim + merge | Clear cookie only |
| Default password login | `/` | `/admin` |
| Navbar cart / wishlist | Yes | Hidden |
| Can open `/admin` | No | Yes |

---

## Key file map

| Concern | Path |
|---------|------|
| Shop permission helpers | `lib/auth/permissions.ts`, `lib/auth/require-customer-shop.ts` |
| Guest handoff skip | `actions/cart.ts` (`performGuestSessionHandoff`) |
| Route gates | `middleware.ts` |
| Cart / checkout / wishlist / review | `actions/*`, `services/cart.service.ts`, `checkout.service.ts`, `wishlist.service.ts`, `review.service.ts` |
| UI | `components/common/Navbar.tsx`, `ProductCustomization.tsx`, `ProductComments.tsx`, `FloatingCartButton.tsx` |

---

## Related docs

- Index: `docs/[08] Business Logic/flow.md`
- Guest handoff: `docs/[08] Business Logic/[02] Guest Flow/[05] Guest Flow - Sign up Log in.md`
- Customer buying: `docs/[08] Business Logic/[05] Customer Flow/[01] Client Flow - Buying.md`
