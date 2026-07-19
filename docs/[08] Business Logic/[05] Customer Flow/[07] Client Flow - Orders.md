# Client Flow — Orders & Order Details

**Scope:** Logged-in customer `flow.md` bullet: view own orders & order details (`/orders`, `/order_details/[id]`), including guest-order claim on login.  
**Out of scope:** Guest-only cookie path (Guest View Order Details); admin Sales order ops; Stripe / invoice stubs (Buying deferred).

**Verdict:** **Mostly works** for owned and claimed orders. Auth checkout → list + details by `user_id`. Guest → login claim attaches orders before cookie clear. Primary user-specific gap: **`/orders` ignores guest cookie while auth** (details still fall through for unclaimed + matching cookie). Shared guest UI gaps (zone/promo, pay CTA, invoice) still apply after claim.

---

## Happy path (what works today)

1. Logged-in user places order → `checkoutAction` sets `user_id` → redirect `/order_details/{encryptedId}`.
2. `/orders` → `getUserOrders(user.id)` → `OrdersTable` (links often raw UUID).
3. Details: decrypt or raw UUID → `getOrderDetails(id, userId, sessionId)` → ownership `order.user_id === userId` → items + payment + shipment.
4. Guest → login: `performGuestSessionHandoff` → `claimGuestOrdersService` → then cart/wishlist → clear cookie on full success. Claimed orders appear on `/orders` and details by ownership.
5. Pre-claim / claim-fail: details can still open unclaimed guest rows via cookie fallthrough; **list does not**.

```text
Auth checkout → order(user_id) → /orders (getUserOrders) → /order_details
Guest→login → claimOrders → merge cart → claim wishlist → clear cookie
Details: auth ownership OR (session match + user_id IS NULL)
```

---

## Capability checklist

| Capability | Status | Notes |
|------------|--------|--------|
| List own orders | Yes | Auth path only on `/orders` |
| Open own order details | Yes | Encrypted or raw id |
| Claim guest orders on login | Yes | Before cookie clear |
| See unclaimed guest orders on `/orders` while auth + cookie | **No** | Details OK; list omits |
| Open another user’s order | Denied | Ownership check |

---

## P0 — Correctness (fix first)

_None verified that block an active user from viewing **owned** or **successfully claimed** orders._

---

## P1 — Incomplete / wrong order behavior

- [ ] **`/orders` ignores guest cookie while authenticated**  
  Details always read cookie and fall through for unclaimed guest rows; list only `getUserOrders(user.id)`. After login, before claim finishes (or if claim fails), list can omit orders that detail URLs still open.  
  **Where:** `app/(public)/orders/page.tsx` vs `order_details/[id]/page.tsx` + `getOrderDetails`.  
  **Do:** Union session unclaimed + user orders while cookie present, or wait for claim / surface merge failure.  
  **Also tracked:** `[02] Client Flow - Guest Capabilities.md`.

- [ ] **Shared guest order UI gaps still apply after claim**  
  Email link ≠ bearer auth; no shipping zone/promo on details UI; no pay CTA; invoice stub; weak unshipped empty state.  
  **Where:** Guest View Order Details.  
  **Do:** Same as guest **Do**s when product wants parity.

---

## P2 — DX / polish

- [ ] **Profile hub “orders” are dummy data** — see Profile & Settings.  
- [ ] **List links often raw UUID; post-checkout uses encrypted id** — both work if ownership passes; unify or document.  
- [ ] **Payment/shipment helpers may use admin client after ownership** — document or prefer session + RLS.  
- [ ] **Claim is session-cookie only** (no email match) — shared-device residual.

---

## Deferred / works-as-implemented

| Behavior | Why OK |
|----------|--------|
| Encrypted id = obfuscation, not auth | Ownership required |
| Claim before cookie clear | Handoff design |
| Details fallthrough for unclaimed + cookie | Intentional bridge |
| Guest SELECT denied by RLS | Guest path uses SR + ownership |
| Invoice / Stripe / cancel by customer | Deferred with Buying |

---

## Edge-case matrix

| Case | Status |
|------|--------|
| Auth owns order, open details | Works |
| Auth `/orders` after own checkout | Works |
| Guest checkout → login → claim OK | Listed + details by `user_id` |
| Auth + unclaimed + matching cookie | Details OK; **list omits** |
| Auth + unclaimed + no/wrong cookie | 404 |
| Auth opens another user’s order | 404 / null |
| Guest opens claimed order | Denied |
| Encrypted vs raw id | Both OK if ownership passes |
| Claim fail, cookie kept | Details fallthrough; list empty for those |
| Profile orders section | Dummy (P2) |

---

## Key file map

| Concern | Path |
|---------|------|
| List | `app/(public)/orders/page.tsx`, `OrdersTable.tsx` |
| Details | `app/(public)/order_details/[id]/page.tsx` |
| Service | `services/order.service.ts` (`getUserOrders`, `getOrderDetails`, `claimGuestOrdersService`) |
| Repo / claim | `repositories/order.repository.ts` |
| Handoff | `actions/cart.ts` (`performGuestSessionHandoff`), `AuthProvider.tsx` |
| Encrypt | `lib/utils/encryption.ts` |
| Tests | `tests/feature/order-ownership.test.ts`, `merge-guest-on-login.test.ts` |

---

## Related docs

- Index: `flow.md` (User → View own orders…)
- Guest path: `[02] Guest Flow/[07] Guest Flow - View Order Details.md`
- Handoff: `[02] Client Flow - Guest Capabilities.md`
- Buying: `[01] Client Flow - Buying.md`

**Highest-impact remaining:** `/orders` ∪ cookie or wait-for-claim → shared details UI polish (zone/promo/pay).
