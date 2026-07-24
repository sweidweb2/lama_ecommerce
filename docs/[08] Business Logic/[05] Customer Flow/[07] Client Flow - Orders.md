# Client Flow — Orders & Order Details

**Scope:** Logged-in customer `flow.md` bullet: view own orders & order details (`/orders`, `/order_details/[id]`), including guest-order claim on login.  
**Out of scope:** Guest-only cookie path (Guest View Order Details); admin Sales order ops; Stripe / invoice stubs (Buying deferred).

**Verdict:** **Works** for owned, claimed, and pre-claim (auth + guest cookie) orders on both list and details. Auth checkout → list + details by `user_id`. Guest → login claim attaches orders before cookie clear. `/orders` unions user + unclaimed session rows while the cookie remains. Shared guest UI gaps (zone/promo, pay CTA, invoice) still apply after claim — tracked as done under Guest View Order Details.

---

## Happy path (what works today)

1. Logged-in user places order → `checkoutAction` sets `user_id` → redirect `/order_details/{encryptedId}`.
2. `/orders` → `getStorefrontOrders(userId, sessionId)` → `OrdersTable` (encrypted ids).
3. Details: decrypt or raw UUID → `getOrderDetails(id, userId, sessionId)` → ownership `order.user_id === userId` or unclaimed session match → items + payment + shipment.
4. Guest → login: `performGuestSessionHandoff` → `claimGuestOrdersService` (session + matching checkout email) → then cart/wishlist → clear cookie on full success. Claimed orders appear on `/orders` and details by ownership.
5. Pre-claim / claim-fail / email-mismatch: list and details both include unclaimed guest rows while the cookie matches; after handoff success the cookie clears (mismatch leaves orders unclaimed — recover via find-order / confirmation link).

```text
Auth checkout → order(user_id) → /orders (getStorefrontOrders) → /order_details
Guest→login → claimOrders(session+email) → merge cart → claim wishlist → clear cookie
List/Details: auth ownership OR (session match + user_id IS NULL)
```

---

## Capability checklist

| Capability | Status | Notes |
|------------|--------|--------|
| List own orders | Yes | `getStorefrontOrders` |
| Open own order details | Yes | Encrypted or raw id |
| Claim guest orders on login | Yes | Session + checkout email match; before cookie clear |
| See unclaimed guest orders on `/orders` while auth + cookie | Yes | Union with user orders |
| Open another user’s order | Denied | Ownership check |

---

## P0 — Correctness (fix first)

_None verified that block an active user from viewing **owned** or **successfully claimed** orders._

---

## P1 — Incomplete / wrong order behavior

- [x] ✅ **`/orders` ignores guest cookie while authenticated** done✅  
  Details always read cookie and fall through for unclaimed guest rows; list only `getUserOrders(user.id)`. After login, before claim finishes (or if claim fails), list can omit orders that detail URLs still open.  
  **Where:** `app/(public)/orders/page.tsx` vs `order_details/[id]/page.tsx` + `getOrderDetails`.  
  **Do:** Union session unclaimed + user orders while cookie present, or wait for claim / surface merge failure.  
  **Also tracked:** `[02] Client Flow - Guest Capabilities.md`.  
  **Done:** `getStorefrontOrders(userId, sessionId)` unions `getUserOrders` + `getSessionOrders` (dedupe by id, newest first); `/orders` always reads guest cookie.

- [x] ✅ **Shared guest order UI gaps still apply after claim** done✅  
  Email link ≠ bearer auth; no shipping zone/promo on details UI; no pay CTA; invoice stub; weak unshipped empty state.  
  **Where:** Guest View Order Details.  
  **Do:** Same as guest **Do**s when product wants parity.  
  **Done:** Details show zone/promo, pay CTA when `payment_url` pending, printable invoice, restock note, shipment empty states (Guest View Order Details).

---

## P2 — DX / polish

- [x] ✅ **Profile hub “orders” are dummy data** done✅ — `/profile` redirects to `/account`; orders live on `/orders`.  
- [x] ✅ **List links often raw UUID; post-checkout uses encrypted id** done✅ — `/orders` maps `encryptOrderId`; table uses `encryptedId`.  
- [x] ✅ **Payment/shipment helpers may use admin client after ownership** done✅  
  Auth-path `getPaymentByOrderId` / `getShipmentByOrderId` used service role despite owner SELECT RLS.  
  **Done:** Those helpers use session client + RLS; `*ForAdmin` remains for guest cookie and signed-token paths.  
- [x] ✅ **Claim is session-cookie only** (no email match) done✅  
  Shared-device residual: any login on the browser could claim all unclaimed session orders.  
  **Done:** `claimOrdersBySessionId` also requires `orders.email` ilike auth email; zero/mismatch claims are success and cookie still clears after cart/wishlist. Historical cross-device email claim stays deferred (Guest Sign up).

---

## Deferred / works-as-implemented

| Behavior | Why OK |
|----------|--------|
| Encrypted id = obfuscation, not auth | Ownership required |
| Claim before cookie clear | Handoff design |
| Details + list fallthrough for unclaimed + cookie | Intentional bridge until claim |
| Guest SELECT denied by RLS | Guest path uses SR + ownership |
| Auth payment/shipment via session RLS | Owner policies; guest/token still SR |
| Claim email mismatch → unclaimed + cookie cleared | Recover via find-order / confirmation link |
| Invoice / Stripe / cancel by customer | Invoice printable HTML done; Stripe/cancel still deferred with Buying |

---

## Edge-case matrix

| Case | Status |
|------|--------|
| Auth owns order, open details | Works |
| Auth `/orders` after own checkout | Works |
| Guest checkout → login → claim OK | Listed + details by `user_id` (checkout email must match account) |
| Auth + unclaimed + matching cookie | List ∪ details OK |
| Auth + unclaimed + no/wrong cookie | 404 on details; list omits guest rows |
| Auth opens another user’s order | 404 / null |
| Guest opens claimed order | Denied |
| Encrypted vs raw id | Both OK if ownership passes |
| Claim fail, cookie kept | List ∪ details fallthrough |
| Claim email mismatch, handoff OK | Orders stay unclaimed; cookie cleared; find-order / email link |
| Profile orders section | Redirected to `/account` |

---

## Key file map

| Concern | Path |
|---------|------|
| List | `app/(public)/orders/page.tsx`, `OrdersTable.tsx` |
| Details | `app/(public)/order_details/[id]/page.tsx` |
| Service | `services/order.service.ts` (`getStorefrontOrders`, `getUserOrders`, `getSessionOrders`, `getOrderDetails`, `claimGuestOrdersService`) |
| Repo / claim | `repositories/order.repository.ts` |
| Handoff | `actions/cart.ts` (`performGuestSessionHandoff`), `AuthProvider.tsx` |
| Encrypt | `lib/utils/encryption.ts` |
| Tests | `tests/feature/order-ownership.test.ts`, `merge-guest-on-login.test.ts`, `storefront-orders-list.test.ts` |

---

## Related docs

- Index: `flow.md` (User → View own orders…)
- Guest path: `[02] Guest Flow/[07] Guest Flow - View Order Details.md`
- Handoff: `[02] Client Flow - Guest Capabilities.md`
- Buying: `[01] Client Flow - Buying.md`

**Highest-impact remaining:** None on this doc’s P0–P2; shared Buying deferred (Stripe/cancel) and historical cross-device email claim (Guest Sign up).
