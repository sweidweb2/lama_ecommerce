# Client Flow — Buying

**Scope:** Choose product → add to cart → place order (virtual / pending payment).  
**Stripe / 3rd-party gateway:** deferred (listed at the end, not a “broken today” bug).

**Verdict:** Not all good. Place-order works end-to-end (including guests). Correctness gaps, incomplete features, and dead/stale paths remain — use the checklists below to fix.

---

## Happy path (what works today)

1. Browse catalog → open `/products/[slug]`.
2. Pick color/size → **Add to cart** (`ProductCustomization` → `addItemToCartAction` → `upsert_cart_item`).
3. Open `/cart` → review lines, pick shipping zone, optional promo, enter address/phone/email.
4. **Place order** → `checkoutAction` → RPC `process_checkout` (fee + optional promo in SQL).
5. Creates `orders` + `order_items` + pending `payments` row, decrements stock, **hard-deletes** cart; `payment_status = pending`.
6. Redirect to `/order_details/[encryptedId]`.

```text
PDP → ATC (upsert_cart_item)
  → /cart → checkoutAction
  → process_checkout (fee from zone; optional promo; pending payments row)
  → orders + order_items + payments(pending) + stock-- + DELETE cart
  → payment_status=pending (synced with payments row)
  → /order_details/[encryptedId]
```

---

## P0 — Correctness (fix first)

- [x] ✅ **Cart UI price ≠ checkout price**  
  Cart / floating cart use `products.price` only; RPC uses `COALESCE(price_override, base_price)`.  
  **Where:** `repositories/cart_item.repository.ts` (select), cart UI (`CartItem`, `CartSidebar`, floating cart).  
  **Do:** Fetch and display `price_override` when set; match RPC pricing.  
  **Done:** Cart selects fetch `price_override`; `unitPrice` / displayed price = `COALESCE(price_override, products.price)` (matches `process_checkout`). Storefront cart, floating cart, and admin cart totals use it.

- [x] ✅ **Qty update skips stock check**  
  Raising quantity is a plain UPDATE; only `upsert_cart_item` validates stock. User can exceed stock until checkout fails.  
  **Where:** cart item update paths in `repositories/cart_item.repository.ts` / `services/cart.service.ts`.  
  **Do:** Re-validate stock on quantity update (same rules as upsert).  
  **Done:** `updateCartItem` / `updateCartItemForAdmin` re-check variant stock before UPDATE (out-of-stock / insufficient stock messages aligned with upsert).

- [x] ✅ **Stock reserved before payment; no restock**  
  Place-order decrements stock while payment stays unpaid. Cancel / fail / refund does not restore stock.  
  **Where:** `process_checkout` RPC; order status updates (admin).  
  **Do:** Either reserve only after paid, or restock on cancel/failed/refunded.  
  **Done:** Prefer restock path. Migration `20260713120000_restock_on_order_cancel.sql` adds `orders.stock_restored` + BEFORE UPDATE trigger that restores `order_items` quantities to `customised_products` when status → `cancelled` or payment_status → `failed`/`refunded` (idempotent).

---

## P1 — Incomplete buying features

- [x] ✅ **No `payments` row on checkout**  
  Order gets `payment_status = pending` only; `payments` table never written. Dual source of truth with no sync.  
  **Where:** `process_checkout` / `services/checkout.service.ts`; `repositories/order.repository.ts` (read-only payments).  
  **Do:** When you define “virtual paid” or Stripe success, insert/update `payments` and keep `orders.payment_status` in sync.  
  **Done:** `process_checkout` inserts `payments` (`status=pending`, `amount=total`). Admin `OrderPaymentForm` → `upsertOrderPaymentAction` upserts payment and syncs `orders.payment_status`. Stripe/webhook still deferred.

- [x] ✅ **Promo codes unused at checkout**  
  Admin `promo_codes` exist; RPC forces `discount = 0`. No promo on order.  
  **Where:** `process_checkout` SQL; `checkoutSchema`; checkout UI.  
  **Do:** Validate promo server-side (or in RPC); apply discount; store code/id on order; bump `use_count`.  
  **Done:** Optional `promo_code` on checkout; RPC validates (active/expiry/max uses), computes discount, sets `orders.promo_code_id`, bumps `use_count`. UI field on cart sidebar + admin checkout dialog.

- [x] ✅ **`user_addresses` unused at checkout**  
  Checkout is free-text → `orders.address_snapshot` only. Account address book not linked.  
  **Where:** cart checkout UI; `user_addresses` / account `AddressList`.  
  **Do:** Prefill / select saved address; optionally save new address after order.  
  **Done:** Cart loads saved addresses; select/prefill + optional “Save this address” after order for logged-in users.

- [x] ✅ **No shipment on place-order; zone not on order**  
  Fee is stored; `shipping_zone_id` is not. No `shipments` row at checkout.  
  **Where:** `orders` schema; `process_checkout`; shipping repos.  
  **Do:** Persist zone id (or zone name snapshot); create shipment when fulfillment starts (or at place-order if desired).  
  **Done:** `orders.shipping_zone_id` + `shipping_zone_name` persisted in `process_checkout`; shipment created when admin marks shipped (carrier + tracking).

- [x] ✅ **RPC trusts app money inputs**  
  `p_shipping_fee` / `p_discount` not re-validated inside `process_checkout`. Safe today only because service forces fee from zone and `discount: 0`.  
  **Where:** `process_checkout` SQL.  
  **Do:** Recompute fee from zone id (and promo) inside the RPC, or pass zone/promo ids and resolve in SQL.  
  **Done:** Migration `20260713130000_process_checkout_resolve_shipping.sql` replaces money args with `p_shipping_zone_id`; RPC looks up fee from `shipping_fees`. Promo discount is also computed inside the RPC (`p_promo_code`); client discount is not trusted.

---

## P2 — DX / dead / stale

- [ ] **Stale `/checkout` references**  
  No checkout page; checkout lives on `/cart`. Middleware / revalidate still mention `/checkout`.  
  **Where:** `middleware.ts`, `actions/cart.ts`, `actions/checkout.ts`.  
  **Do:** Remove or add a real `/checkout` route and point everything there.

- [ ] **Dead fake ATC**  
  `ProductActions.tsx` has a simulated add-to-cart; PDP uses `ProductCustomization` only.  
  **Where:** `components/(public)/products/product_details/ProductActions.tsx`.  
  **Do:** Wire to real ATC or delete/stop exporting as live ATC.

- [x] **Material not selectable on storefront**  
  Variant picker is color/size only; material variants can collide or be ignored.  
  **Where:** `ProductCustomization.tsx`.  
  **Do:** Include material (and any other variant axes) in selection.

- [x] **Auth ATC skips add-to-cart stats**  
  Guest/admin paths bump `product_stats.add_to_cart_count`; logged-in ATC may not.  
  **Where:** `services/cart.service.ts`.  
  **Do:** Call the same increment for authenticated ATC.

- [x] **No order confirmation email**  
  Place-order does not send mail.  
  **Where:** `actions/checkout.ts` / post-checkout hooks.  
  **Do:** Add provider + send after successful RPC.  
  **Done:** Resend via `lib/email` + `sendOrderConfirmationEmailService` fire-and-forget from `checkoutService` after successful RPC. Set `RESEND_API_KEY` and `EMAIL_FROM`.

- [x] **Sold variants can be hard-deleted**  
  `order_items.customised_product_id` has no FK; delete checks cart/wishlist only, not order history.  
  **Where:** `repositories/product_variant.repository.ts`; schema.  
  **Do:** Block delete if referenced by `order_items`, or add FK / keep snapshots-only policy documented.  
  **Done:** App blocks delete when `order_items` reference the variant (also on product hard-delete). DB FK `order_items.customised_product_id → customised_products(id) ON DELETE RESTRICT` so restock-on-cancel keeps a live row. Order UI still uses snapshots.

---

## Deferred (not bugs — planned later)

- [ ] Stripe (or other gateway) + webhook to mark order/payment paid  
- [ ] Client payment method UI (today is **Place order** only)

---

## DB tables in this flow

| Table | Role |
|-------|------|
| `products` / `customised_products` / images | Catalog + stock |
| `carts` / `cart_items` | Active cart; cart deleted after checkout |
| `orders` / `order_items` | Pending order + line snapshots |
| `shipping_zones` / `shipping_fees` | Fee lookup at checkout |
| `product_stats` | ATC / purchase counters (partial) |
| `user_addresses` | Account + checkout prefill / optional save |
| `promo_codes` | Optional at checkout (`orders.promo_code_id`) |
| `payments` | Pending row created at place-order |
| `shipments` | Created when admin marks order shipped |

---

## Guest vs authenticated

| | Auth | Guest |
|--|------|--------|
| Cart owner | `user_id` | `session_id` (HttpOnly `guest_session_id`) |
| Cart writes | Session client + RLS | Service role after cookie check |
| Checkout | `p_user_id` | `p_session_id` required |
| Orders | RLS by `user_id` | Lookup by `session_id` + `user_id IS NULL` |
| Login | Merge guest cart into user cart | — |

Guests can complete the full place-order path without signing in.
