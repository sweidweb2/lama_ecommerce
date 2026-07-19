# Guest Flow — View Order Details

**Scope:** After guest place-order → open `/order_details/[id]` (and related `/orders` list) without logging in.  
**Out of scope:** Authenticated account orders as a primary product (same page is shared); Stripe / client pay UI (deferred with Buying flow); admin order edit.

**Verdict:** Same-browser guest viewing after checkout works. Access is **not** “encrypted link alone” — it is **decrypt/raw order id + matching `guest_session_id` cookie** (service-role fetch + app ownership). Email “View order details” links, cookie loss, and login do **not** preserve access. No claim-by-email, order lookup, or guest cancel. Use the checklists below to fix.

---

## Happy path (what works today)

1. Guest completes checkout on `/cart` with HttpOnly `guest_session_id` → RPC stores `orders.user_id = null`, `orders.session_id = cookie`.
2. Confirmation email may include encrypted `/order_details/…` link (when site URL env is set).
3. Cart redirects → `encryptOrderIdAction` → `/order_details/{encryptedId}`.
4. Page decrypts AES-256-GCM id (or keeps raw UUID) → reads guest cookie → `getOrderDetails(orderId, null, sessionId)`.
5. Service loads order via admin client (RLS blocks guest SELECT) and requires `user_id IS NULL` and `session_id === cookie`.
6. Renders items, payment row, shipment (if any), totals, address, contact, placed/updated times.

```text
Guest checkout (guest_session_id cookie)
  → process_checkout → order(user_id=null, session_id) + items + payments(pending)
  → email(encrypted link) + redirect /order_details/{encryptedId}
  → decrypt (or raw UUID) → getGuestSessionId()
  → getOrderDetails(null, sessionId)
       → getOrderByIdForAdmin + session ownership
       → items / payment / shipment (*ForAdmin)
  → UI (or notFound)
```

Optional re-entry on the **same browser** (cookie still valid): open `/orders` → session list → raw UUID link → same ownership checks.

---

## P0 — Correctness (fix first)

- [ ] **Encrypted email link is not a capability token**  
  Encryption only hides the UUID and rejects tampering (GCM fail → fall through to raw string → ownership/`notFound`). Viewing still requires `guest_session_id === orders.session_id`. Confirmation email presents “View order details” as if the link alone works; new browser / cleared cookies → **404**.  
  **Where:** `lib/email/order-confirmation.ts` (`buildOrderDetailsUrl`); `app/(public)/order_details/[id]/page.tsx`; `services/order.service.ts` (`getOrderDetails`).  
  **Do:** Treat the link as a bearer (signed token + email/order binding, no session) **or** add verified lookup and stop implying email-only re-access.

- [x] ✅ **Logged-in user visiting a prior guest order URL → 404** done✅  
  If auth user is present, page never reads the guest cookie. Guest orders have `user_id = null` → auth branch (`order.user_id !== userId`) fails → `notFound`. Guest who places an order then logs in cannot open that order URL.  
  **Where:** `app/(public)/order_details/[id]/page.tsx` (~113–119); `services/order.service.ts` (~90–108).  
  **Do:** Allow view when session still matches **or** after claim / email match for the logged-in user.  
  **Done:** Login claims guest orders onto `user_id` before clearing the cookie, so authenticated `/order_details` resolves by ownership.

- [x] ✅ **Login clears guest cookie without attaching guest orders** done✅  
  `mergeGuestCartOnLoginAction` merges carts and always clears `guest_session_id`. Orders stay `user_id = null` with the old `session_id`. After login, guest order history and detail URLs are unreachable under the new identity.  
  **Where:** `actions/cart.ts` (`mergeGuestCartOnLoginAction` ~64–65); no order claim in signup/login path.  
  **Do:** On login/signup, claim matching guest orders (e.g. verified email → set `orders.user_id`) **or** keep session cookie until claim, and list claimed orders under the user.  
  **Done:** `claimGuestOrdersService` runs before cart merge; cookie cleared only after both succeed.

---

## P1 — Incomplete / wrong view-order behavior

- [ ] **No re-access without the same cookie**  
  Cookie is HttpOnly, 14 days. Middleware does **not** mint `guest_session_id` on `/order_details` or `/orders` (those paths hit default `next()`). Guest who only opens an email link never gets a new matching cookie anyway (cookie must equal the order’s stored `session_id`).  
  **Where:** `middleware.ts` (public/cart/wishlist mint only); `lib/auth/guest-session.ts`; `app/(public)/orders/page.tsx`.  
  **Do:** Magic link / email+order# verified lookup; optionally document that list/detail depend on an existing cart-minted cookie.

- [ ] **No order lookup by email / short order id**  
  No find-order flow for guests who lost the cookie or link.  
  **Where:** No service/repo for public lookup; only `getSessionOrders` / `getUserOrders` / admin.  
  **Do:** Verified lookup (email code or signed token) returning the same details page safely.

- [ ] **Promo code and shipping zone name omitted on details UI**  
  Discount amount shows when `> 0`; `promo_code_id` / code string not shown. `shipping_zone_name` exists on the order and in confirmation email, but the public details page does not display it.  
  **Where:** `app/(public)/order_details/[id]/page.tsx` (summary sidebar); `lib/email/order-confirmation.ts` (zone in email); admin order page shows zone.  
  **Do:** Show zone name and applied promo code when present.

- [ ] **No pay CTA / `payment_url` on storefront details**  
  Payment card shows status/method/gateway/amount; `payment_url` is never surfaced. Pending toast / place-order path has no guest “Pay now”.  
  **Where:** `app/(public)/order_details/[id]/page.tsx`; `types/order.ts` (`payment_url`); admin `OrderPaymentForm`.  
  **Do:** When Stripe (or similar) lands, link pay CTA from `payment_url` for pending payments (align with Buying deferred items).

- [ ] **No guest cancel; invoice stub only**  
  Storefront cannot cancel. `/orders` has disabled **Download Invoice** (“Coming soon”). Cancelled/failed/refunded orders still render if ownership passes; no restock messaging (`stock_restored` unused in UI).  
  **Where:** `components/(public)/orders/OrdersTable.tsx`; order details page badges only.  
  **Do:** Define cancel policy (or admin-only) + implement invoice or remove stub.

- [ ] **Shipment / tracking empty until admin ships**  
  Shipment card only appears when a `shipments` row exists (created when admin marks shipped). Guests see no “awaiting shipment” empty state.  
  **Where:** `app/(public)/order_details/[id]/page.tsx` (`{shipment && …}`); admin ship flow.  
  **Do:** Explicit “Not shipped yet” state when status warrants it.

---

## P2 — DX / dead / stale / edge cases

- [ ] **`/orders` + `/order_details` skip guest cookie mint**  
  Unlike `/`, `/products`, `/cart`, `/wishlist`, these routes do not call `ensureGuestSessionCookie`. Harmless if cookie already exists from browse/cart; odd if someone lands cold on `/orders` (empty list, no mint).  
  **Where:** `middleware.ts` default branch.  
  **Do:** Include `/orders` and `/order_details` in mint list **or** document reliance on prior storefront routes (mint alone cannot restore old session id).

- [ ] **List links use raw UUID; post-checkout uses encrypted id**  
  Page accepts both by design. `OrdersTable` / `ProfileOrders` link `/order_details/${order.id}`. Ownership still required; encrypted URLs are obfuscation only, not auth.  
  **Where:** `components/(public)/orders/OrdersTable.tsx` (~329); `app/(public)/order_details/[id]/page.tsx` (~105–111); `CartSidebar.tsx` redirect.  
  **Do:** Unify on encrypted links for consistency, or document dual support intentionally.

- [ ] **Profile “orders” are dummy data**  
  `app/(public)/profile/page.tsx` feeds `ProfileOrders` with fabricated orders, not real `getUserOrders`. Misleading next to real `/orders`.  
  **Where:** `app/(public)/profile/page.tsx`; `components/(public)/profile/ProfileOrders.tsx`.  
  **Do:** Wire real orders or remove the section.

- [ ] **`formatCurrency` treats `0` as empty**  
  `if (!amount) return "$0.00"` collapses legitimate `0` the same as null — OK for money often, but masks null vs zero inconsistently vs email helper.  
  **Where:** `app/(public)/order_details/[id]/page.tsx` (~78–84).  
  **Do:** Use `amount == null` like `lib/email/order-confirmation.ts` `formatMoney`.

- [ ] **Encrypted id never expires; `encryptOrderIdAction` is unauthenticated**  
  AES ciphertext has no TTL. Anyone can call encrypt for URL building; that alone does not grant read (ownership still required). Fine if documented; confusing if email is treated as secret.  
  **Where:** `lib/utils/encryption.ts`; `actions/order.ts`.  
  **Do:** Document, or switch email to a short-lived signed access token.

- [ ] **No status history / product images on public details**  
  Timeline is only `created_at` / `updated_at`. Line items are text snapshots (no images). Admin has richer status UI (`OrderStatusStepper`).  
  **Where:** public `order_details` page vs `app/admin/orders/[id]/page.tsx`.  
  **Do:** Optional public timeline / thumbnails if product needs it.

- [ ] **Checkout revalidation omits `/order_details`**  
  `checkoutAction` revalidates `/cart`, `/orders`, `/account` — not `/order_details`. Usually fine (client navigates to a fresh URL).  
  **Where:** `actions/checkout.ts`.  
  **Do:** Revalidate order detail path if soft-nav / caching ever shows stale empties.

---

## Deferred (not bugs — planned later)

- [ ] Stripe (or other gateway) + webhook to mark order/payment paid  
- [ ] Client payment method UI / pay CTA on order details  
- [ ] Invoice PDF download  

---

## DB tables in this flow

| Table | Role |
|-------|------|
| `orders` | Guest row: `user_id` null, `session_id` = cookie; snapshots address/email/phone/totals/zone |
| `order_items` | Line snapshots (name/size/color/material/price) |
| `payments` | Pending (or later) row; shown on details when present |
| `shipments` | Optional; created when admin marks shipped |
| `promo_codes` | Via `orders.promo_code_id` only (not joined on public UI) |
| Cookie `guest_session_id` | Real guest auth for read; 14-day HttpOnly |

---

## Guest vs authenticated (same `/order_details` page)

| | Guest | Authenticated |
|--|-------|----------------|
| Route | `/order_details/[id]` (public) | Same page |
| List | `/orders` → `getSessionOrders(sessionId)` | `/orders` → `getUserOrders(userId)` |
| Order fetch | Admin client + `user_id IS NULL` + session match | Session client / RLS + `user_id === auth` |
| Items / payment / shipment | `*ForAdmin` after ownership | User path for order; payment/shipment often admin helpers after check |
| Cookie | Required | Ignored when logged in |
| Claim on login | **None** today (cart merge only) | — |
| Email link | Encrypted URL; still needs session today | Auth orders need matching `user_id` |

Guests can view order details **only while the guest session cookie that placed the order remains valid** (or until a claim/lookup path is added).

---

**Highest-impact fixes:** email/session access model (bearer link or verified lookup) → claim guest orders on login/signup → allow logged-in users to open prior guest orders → show zone/promo + honest unshipped/pending-pay states → wire or remove profile dummy orders / invoice stub.
