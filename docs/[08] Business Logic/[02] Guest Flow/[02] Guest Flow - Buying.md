# Guest Flow — Buying (ATC → Cart → Checkout)

**Scope:** Guest (not logged in) **Add to cart** → **update / remove cart** → **checkout (place order)**.  
**Out of scope:** Authenticated account addresses / reviews; Stripe; browse-only catalog (see `[01] Guest Flow - Browse.md`).  
**Stripe / 3rd-party gateway:** deferred (listed at the end, not a “broken today” bug).

**Verdict:** Guest ATC → cart → place order works end-to-end in the **same browser session** (HttpOnly `guest_session_id` + service-role cart/order access + `process_checkout` with `p_session_id`). Serious gaps sit on the **guest↔auth boundary** (cookie clear + no order claim) and **order access without the original cookie**. Use the checklists below to fix.

---

## Happy path (what works today)

1. Middleware (or first ATC) mints HttpOnly `guest_session_id` on storefront / cart routes.
2. Open `/products/[slug]` → pick color/size/material → **Add to cart**  
   (`ProductCustomization` → `addItemToCartAction` → `addItemToGuestCartService` → admin cart create + `upsert_cart_item` / stock check).
3. Open `/cart` (or floating cart) → guest cart loaded via `getGuestCartWithItemsService`.
4. Change qty / remove line → `updateCartItemQuantityAction` / `deleteCartItemAction` → guest ownership assert → stock-checked update / delete.
5. Pick shipping zone, optional promo, enter address / phone / email → **Place order**  
   (`CartSidebar` → `checkoutAction` → `checkoutService` → RPC `process_checkout` with `p_session_id`).
6. Creates `orders` + `order_items` + pending `payments`, decrements stock, **hard-deletes** cart; confirmation email to `order.email`.
7. Redirect to `/order_details/[encryptedId]` (same cookie) → guest order readable by `session_id` + `user_id IS NULL`.

```text
PDP (guest cookie)
  → ATC (service role + session_id cart)
  → /cart | floating cart (guest read)
  → qty update / remove (assert guest ownership)
  → checkoutAction (session_id, user_id null)
  → process_checkout (p_session_id ownership)
  → orders + order_items + payments(pending) + stock-- + DELETE cart
  → email + /order_details/[encryptedId] (cookie-bound)
```

---

## P0 — Correctness / security (fix first)

- [ ] **Login clears guest cookie; guest orders never claimed**  
  Guest places order(s) → signs in → `mergeGuestCartOnLoginAction` deletes `guest_session_id`. Orders remain `user_id = null` / `session_id = …`. Logged-in `/orders` and `getOrderDetails` only resolve by `user_id`, so prior guest orders **disappear**. Encrypted confirmation links also **404** once authenticated (page prefers auth and never falls back to session).  
  **Where:** `actions/cart.ts` (`mergeGuestCartOnLoginAction`); `providers/AuthProvider.tsx` (`SIGNED_IN`); `services/order.service.ts` (`getOrderDetails`); `app/(public)/order_details/[id]/page.tsx`; `app/(public)/orders/page.tsx`.  
  **Do:** On login/signup, claim guest orders (`UPDATE orders SET user_id = … WHERE session_id = … AND user_id IS NULL`) **before** clearing the cookie; and/or treat encrypted order id as a guest capability. Prefer claiming so account `/orders` works after signup/login.

- [ ] **Guest cookie cleared even when cart merge fails**  
  If `mergeGuestCartToUserService` fails, cookie is still deleted (`“regardless of merge outcome”`) → active guest cart (and session order access) become unreachable; rows orphan under the old `session_id`.  
  **Where:** `actions/cart.ts` — `mergeGuestCartOnLoginAction`.  
  **Do:** Call `clearGuestSessionCookie()` only after successful merge (or after successful order claim + merge). On failure keep cookie and surface retry.

---

## P1 — Incomplete guest buying features / portability

- [ ] **Order-details link in email is cookie-bound (not portable)**  
  Email builds `/order_details/{encryptedId}`, but guest read still requires matching HttpOnly `guest_session_id`. Another device, cleared cookies, or private browser → `notFound()`. Encrypted id alone is not a capability.  
  **Where:** `lib/email/order-confirmation.ts` (`buildOrderDetailsUrl`); `services/order.service.ts` (`getOrderDetails` guest branch); `app/(public)/order_details/[id]/page.tsx`.  
  **Do:** Signed email token / magic-link verification, **or** claim-to-account on login (pairs with P0), **or** allow encrypted-id guest read with rate limits. Document current cookie dependency until fixed.

- [ ] **Cart merge can exceed stock**  
  Login merge moves guest lines with raw quantity UPDATE and **no stock assert**. Merged cart can exceed `quantity_stock`; checkout fails later.  
  **Where:** `repositories/cart_item.repository.ts` — `moveCartItemsToCart`; `services/cart.service.ts` — `mergeGuestCartToUserService`.  
  **Do:** Merge via `upsert_cart_item` or `assertCartItemQuantityWithinStock`; clamp or fail with a user-visible error.

- [ ] **`/orders` and `/order_details` skip guest cookie ensure**  
  Middleware mints `guest_session_id` on `/`, `/products`, `/auth*`, `/cart`, `/wishlist` — not on `/orders` or `/order_details`. Direct hits with missing/invalid cookie do not remint. Usually OK after catalog browse; with expired cookie → empty list / 404 and no recovery. Reminting alone cannot recover an expired session’s orders (needs P0 claim/token).  
  **Where:** `middleware.ts` (`ensureGuestSessionCookie` coverage).  
  **Do:** Ensure guest cookie on `/orders` and `/order_details` (or all storefront routes). Pair with P0 claim / portable order access.

---

## P2 — DX / edge UX

- [ ] **Empty guest cart can still click “Place order”**  
  Cart row exists with `items.length === 0` → sidebar still shows Place order. RPC raises `Cart is empty` (mapped). Friction only.  
  **Where:** `app/(public)/cart/page.tsx`; `components/(public)/cart/CartSidebar.tsx`.  
  **Do:** Disable Place order when `items.length === 0` / subtotal is 0.

- [ ] **Promo discount not reflected in guest checkout UI total**  
  Promo is applied correctly in SQL; sidebar shows Discount `$0` and `total = subtotal + shipping` only. Guest sees a higher total than charged until confirmation / order details.  
  **Where:** `components/(public)/cart/CartSidebar.tsx`.  
  **Do:** Server-side promo preview, or hide discount/total copy until post-checkout and show applied amount on order details.

- [ ] **Guest cookie is not sliding-expiry**  
  Valid cookie is not refreshed on reuse (`getOrCreateGuestSessionId` / middleware only write when missing/invalid). After ~14 days absolute, cookie expires → cart + guest order UI access gone (DB rows remain).  
  **Where:** `lib/auth/guest-session.ts`; `middleware.ts` — `ensureGuestSessionCookie`.  
  **Do:** Optionally refresh `maxAge` on activity; claim orders to accounts; warn before expiry if product needs it.

- [ ] **Concurrent guest ATC can create orphan carts**  
  No unique “one open cart per `session_id`”. Race: two `createCart` for same session → newest wins in lookups; older cart+items orphaned.  
  **Where:** `addItemToGuestCartService` + `createCart` / `hasActiveCartBySessionId`; index `idx_carts_session_id` (non-unique).  
  **Do:** Partial unique index on `(session_id) WHERE user_id IS NULL`, or upsert / advisory lock.

- [ ] **Weak phone / client email checks**  
  Phone only length bounds; client email often only checks `'@'`. Server Zod is stricter for email. Junk phones can still land on orders.  
  **Where:** `lib/validators/checkout/checkout.ts`; `CartSidebar` client validation.  
  **Do:** Align client + server (E.164 / country rules) if business requires it.

- [ ] **Navigate away mid-checkout**  
  Leave page during RPC → order may still commit (stock--, email sent) with no redirect. Guest can still find it on `/orders` **if cookie remains**.  
  **Where:** `CartSidebar.handleCheckout`.  
  **Do:** Document as acceptable, or add idempotency / “resume last pending order” banner.

---

## Edge-case matrix (guest ATC / cart / checkout)

| Edge case | Status |
|-----------|--------|
| Missing cookie at ATC | Works — `getOrCreateGuestSessionId` (+ middleware on product/cart routes) |
| Missing cookie at checkout | Fails clearly — no active session |
| Invalid / reminted cookie | Remint on covered routes; **orphans** previous session cart/orders |
| Empty cart checkout | RPC rejects; UI still allows click |
| Stock insufficient / race | Handled in upsert + `process_checkout` error mapping |
| Promo as guest | Works in RPC |
| Shipping zone as guest | Works (zone id → fee in SQL) |
| Email / phone required | Email solid server-side; phone weak |
| Confirmation email | Sent; **details URL cookie-bound** |
| Floating cart | Works for guests |
| Login after ATC (before checkout) | Cart merge intended; stock merge gap (P1); cookie clear footgun (P0) |
| Login after checkout | **Broken for order history/details** (P0) |
| Mid-checkout navigate away | Possible silent success + email; session `/orders` OK if cookie lives |

---

## Deferred (not bugs — planned later)

- [ ] Stripe (or other gateway) + webhook to mark order/payment paid  
- [ ] Client payment method UI (today is **Place order** only)

---

## DB / ownership (guest buying)

| Table / mechanism | Guest role |
|-------------------|------------|
| `guest_session_id` cookie | HttpOnly identity; minted in middleware / `getOrCreateGuestSessionId` |
| `carts` / `cart_items` | `session_id` owner; app uses **service role** after cookie check (no anon RLS bypass) |
| `upsert_cart_item` | Stock-checked add/update (EXECUTE not for bare anon cart ownership) |
| `process_checkout` | `p_session_id` must match cart; **EXECUTE `service_role` only** |
| `orders` / `order_items` | Guest: `user_id IS NULL` + `session_id`; lookup by session until claimed |
| `payments` | Pending row at place-order |
| `promo_codes` / shipping tables | Same RPC path as auth; money resolved in SQL |
| `product_stats` | ATC increment on successful guest add |

---

## Guest vs authenticated (buying only)

| | Auth | Guest |
|--|------|--------|
| Cart owner | `user_id` | `session_id` (`guest_session_id`) |
| Cart writes | Session client + RLS | Service role after cookie check |
| Checkout | `p_user_id` | `p_session_id` required |
| Orders UI | RLS / lookup by `user_id` | Lookup by `session_id` + `user_id IS NULL` |
| After login | Owns auth cart | Cookie cleared; **orders not claimed today** (P0) |

Guests can complete place-order without signing in. **Recovering those orders after login or on another device is incomplete** until P0/P1 are fixed.
