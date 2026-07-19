# Admin Flow — Sales

**Scope:** Admin Sales from `flow.md`: orders (view/edit/status/payment/shipment), carts (view/manage/checkout), shipping zones, promo codes.  
**Out of scope:** Storefront guest/user checkout (Guest/Client Buying docs), Stripe/webhooks (deferred), dashboard KPIs, catalog stock UI beyond restock-on-cancel.

**Verdict:** **Fulfillment ops mostly work** — order list/detail, status + shipment-on-shipped, payment sync from edit, cancel restock, shipping zone CRUD, promo CRUD + checkout apply. **Not complete:** admin **cart checkout is broken** for other users’/guest carts (ownership mismatch); dedicated **`order_payment` page is a stub**; cart **line-item delete** and order-item CRUD dialogs are unwired.

---

## Happy path (what works today)

### Orders
1. `/admin/orders` → `getAdminOrders` (`canAccessAdmin`) → list + client filters.
2. Encrypted detail → `getAdminOrderDetails` → items, payment, shipment.
3. Edit dialog → `updateOrderAction` → `updateOrderService` → `updateOrder` (admin client); `payment_status` change upserts `payments`.
4. Status stepper → `updateOrderStatusAction`; first → `shipped` requires carrier + tracking → `createShipment` (rollback status if insert fails).
5. Cancel (or payment `failed`/`refunded`) → DB trigger `trg_restock_order_inventory` restocks once (`stock_restored`).

### Carts
1. `/admin/carts` → `getAllCartsForAdminService` (`requireAdmin`).
2. Create cart (user or session) → add item (`upsert_cart_item` stock) / update qty (stock assert) → hard-delete whole cart.
3. Checkout button opens `CheckoutDialog` → calls storefront `checkoutAction` (**fails for non-admin-owned carts** — P0).

### Shipping zones
1. `/admin/shippings` → CRUD via Zod + admin-gated service + RLS.
2. Fee on `shipping_fees`; storefront/admin checkout resolves fee in `process_checkout`.

### Promo codes
1. `/admin/promocodes` → full CRUD (code uppercased, unique).
2. Apply at checkout only: `process_checkout` validates active / expiry / `max_uses`, discounts, increments `use_count`.

```text
/admin/orders → getAdminOrders / getAdminOrderDetails
  → updateOrder* → updateOrderService → updateOrder + optional createShipment
  → cancel/failed/refunded → restock trigger

/admin/carts → admin cart CRUD
  → CheckoutDialog → checkoutAction (admin identity) → process_checkout
       ✗ fails when cart.user_id / session_id ≠ admin

/admin/shippings → shipping_zone CRUD
/admin/promocodes → promo_code CRUD → apply inside process_checkout
```

---

## P0 — Correctness (fix first)

- [ ] **Admin cart checkout cannot place orders for other carts**  
  `CheckoutDialog` calls storefront `checkoutAction`, which sets `user_id` = **current admin** and `session_id` = null (when logged in). `process_checkout` requires cart ownership match → `"Cart does not belong to this user/session"`. Guest carts and other users’ carts always fail. Admin’s **own** cart can succeed.  
  **Where:** `components/admin/cart/CheckoutDialog.tsx`; `actions/checkout.ts`; `process_checkout` ownership check.  
  **Do:** Admin-only checkout path that loads the cart’s `user_id` / `session_id` and passes those into `processCheckout` (service role); or `admin_process_checkout` that places for the cart owner without swapping identity.

- [ ] **`/admin/orders/[id]/order_payment` is dummy data + wrong id**  
  Hard-coded payment; `order_id` is the **encrypted URL segment**, not a decrypted UUID. Submit would fail Zod `uuid` (or worse). Not linked from order detail today.  
  **Where:** `app/admin/orders/[id]/order_payment/page.tsx`.  
  **Do:** Decrypt → fetch real payment → wire `OrderPaymentForm`, or remove route until ready. Prefer payment edits via existing `EditOrderDialog` sync.

---

## P1 — Incomplete / wrong sales behavior

- [ ] **Admin cart line-item delete is a stub**  
  `DeleteCartItemDialog` without `onDelete` only `console.log`s. Storefront `deleteCartItemAction` is user/guest-scoped.  
  **Where:** `components/admin/cart/DeleteCartItemDialog.tsx`; `CartItemsTable.tsx`.  
  **Do:** `deleteCartItemForAdminAction` + admin-client hard delete; wire `onDelete`.

- [ ] **Edit order → `shipped` without carrier/tracking fails opaquely**  
  Stepper collects shipment fields; edit dialog can set `shipped` with no carrier → `createShipmentSchema` fails.  
  **Where:** `components/admin/order/edit_form.tsx`; `updateOrderService` shipment branch.  
  **Do:** Block `shipped` in edit unless shipment exists, or collect carrier/tracking there.

- [ ] **Checkout dialog subtotal ignores `price_override`**  
  Admin cart detail uses `unitPrice`; `getCartWithItemsForAdminAction` sum for dialog uses base `product.price`. Wrong estimate (SQL still uses correct prices).  
  **Where:** `actions/cart.ts` `getCartWithItemsForAdminAction`.  
  **Do:** Sum `unitPrice * quantity` like the detail page.

- [ ] **`returned` does not restock**  
  Restock only on `cancelled` or payment `failed`/`refunded`.  
  **Where:** `restock_order_inventory` trigger / migrations.  
  **Do:** Restock on `returned`, or document + force cancel/refund path.

- [ ] **Payment `failed`/`refunded` restocks while fulfillment may continue**  
  Changing payment alone can restock even if status stays `shipped`/`delivered`.  
  **Where:** same trigger; order edit payment select.  
  **Do:** Guard (restock only with cancel, or force cancel on refund).

- [ ] **Order hard-delete UI disabled; almost always blocked**  
  Detail `DeleteOrderDialog` disabled; checkout always inserts `payments` → delete refused. Action comments may still say soft-delete.  
  **Where:** `app/admin/orders/[id]/page.tsx`; `deleteOrderService`.  
  **Do:** Align product (cancel-only vs true delete); fix comments.

---

## P2 — DX / stubs / polish

- [ ] **Order item create/edit/delete dialogs are dead stubs** (`console.log`); table read-only.  
  **Where:** `CreateOrderItemDialog`, `EditOrderItemDialog`, `DeleteOrderItemDialog`.  
  **Do:** Wire with stock/total recalculation, or delete stubs.

- [ ] **Duplicate cart add stubs** (`CreateCartItemDialog` / cart `edit_form`) vs real `AddCartItemDialog`.  
  **Do:** Remove stubs or wire.

- [ ] **Promo Zod allows percentage &gt; 100**; UI caps at 100.  
  **Where:** `lib/validators/promo/base.ts`.  
  **Do:** `.max(100)` when `discount_type === 'percentage'`.

- [ ] **No status transition graph** — can jump `pending` → `delivered` or reverse.  
  **Where:** `OrderStatusStepper`; `updateOrderStatusAction`.  
  **Do:** Optional forward-only / allowed-edge matrix.

- [ ] **No shipment update** after create (carrier typo stuck).  
  **Where:** `shipment.repository.ts`.

- [ ] **Promo/shipping lists: full client fetch** — fine at small N.  
- [ ] **Payment/shipment count helpers return `0` on error** → delete guard could fail open.  
  **Where:** `repositories/order.repository.ts`.  
  **Do:** Fail closed.

---

## Deferred (not bugs — planned later)

- [ ] Stripe / gateway webhooks — manual payment status via admin today  
- [ ] Order line CRUD post-checkout — snapshots intentional read-only  
- [ ] Shipping money edits on order — fee/discount disabled in edit; zone fee at checkout  
- [ ] Admin create order from scratch — path is cart → checkout (`create_form` stub)  
- [ ] Email on status/shipment change — confirmation mainly on checkout  
- [ ] Zone/promo delete with historical orders — FK `ON DELETE SET NULL` (name/code snapshot kept)

---

## Works as implemented (not bugs)

| Behavior | Why OK |
|----------|--------|
| Cancel restock once | Trigger + `stock_restored` idempotent |
| Payment sync from order edit | `updateOrder` → upsert payment |
| Shipment on first `shipped` (stepper) | Carrier/tracking + rollback |
| Authz | Middleware `/admin` + `requireAdmin` / `canAccessAdmin` + RLS on promo/zones |
| Promo apply at checkout | Validated in `process_checkout` |
| Hard-delete cart (whole) | Admin path works |

---

## Edge-case matrix

| Case | Status |
|------|--------|
| Admin checkout guest cart | **Fails** ownership (P0) |
| Admin checkout other user’s cart | **Fails** (P0) |
| Admin checkout own cart | Works |
| Mark `shipped` via stepper + carrier | Works |
| Mark `shipped` via edit, no shipment | **Fails** validation (P1) |
| Re-mark `shipped` when shipment exists | Works (status only) |
| Cancel order | Restock once |
| Cancel then refund | No double restock |
| Payment → `refunded` only | Restocks; order may stay active (P1) |
| Status → `returned` | **No restock** (P1) |
| Delete order with payment | Blocked; UI disabled |
| Admin delete cart item | **Stub** (P1) |
| Admin delete whole cart | Works |
| Add/update qty over stock | Rejected |
| Invalid / expired / maxed promo | Rejected in SQL |
| Duplicate promo code | Unique; opaque error (P2) |
| Delete shipping zone in use | Allowed; FK SET NULL |
| Percentage 150% via API | Allowed by Zod (P2) |
| `order_payment` page | **Broken stub** (P0) |

---

## Sub-area status

| Sub-area | List | View | Edit | Delete | Notes |
|----------|------|------|------|--------|-------|
| Orders | OK | OK | OK (contact/status/payment) | Disabled / blocked | Shipment via stepper OK |
| Order items | — | OK | Stub | Stub | Read-only today |
| Payment page | — | Stub | Stub | — | Prefer edit dialog |
| Shipment | — | OK | Create-on-shipped | — | No update |
| Carts | OK | OK | Add/qty OK | Cart OK; **item stub** | |
| Admin checkout | — | UI | — | — | **P0 broken** |
| Shipping zones | OK | OK | OK | OK | |
| Promo codes | OK | OK | OK | OK | Apply at checkout OK |

---

## Key file map

| Layer | Paths |
|-------|--------|
| Pages | `app/admin/orders/**`, `carts/**`, `shippings/page.tsx`, `promocodes/page.tsx` |
| Actions | `actions/order.ts`, `actions/cart.ts` (admin), `actions/shipping.ts`, `actions/promo.ts`, `actions/checkout.ts` |
| Services | `services/order.service.ts`, `cart.service.ts`, `checkout.service.ts`, `shipping_zone.service.ts`, `promo_code.service.ts` |
| Repos | `order.repository.ts`, `shipment.repository.ts`, `cart*.repository.ts`, `shipping_zone.repository.ts`, `promo_code.repository.ts` |
| SQL | `process_checkout`, `restock_order_inventory` (migrations) |
| UI | `components/admin/order/*`, `cart/*`, `shipping/*`, `promo/*` |
| Auth | `middleware.ts`, `lib/auth/require-admin.ts` |

---

## DB tables in this flow

| Table | Role |
|-------|------|
| `orders` / `order_items` | Admin view/edit; snapshots |
| `payments` | Upsert with payment_status; blocks hard delete |
| `shipments` | Create on first shipped |
| `carts` / `cart_items` | Admin manage; checkout via RPC |
| `shipping_zones` / `shipping_fees` | Zone CRUD + checkout fee |
| `promo_codes` | CRUD + checkout apply / `use_count` |
| `customised_products` | Stock decrement / restock |

---

## Related docs

- Index: `docs/[08] Business Logic/flow.md` (Admin → Sales)
- Storefront buying: `[02] Guest Flow/[02] Guest Flow - Buying.md`, `[05] Customer Flow/[01] Client Flow - Buying.md`
- Dashboard order previews: `[04] Admin Flows/[02] Admin Flow - Dashboard.md`

**Highest-impact fixes:** admin checkout with cart-owner identity → wire cart item delete → replace/remove dummy `order_payment` → clarify returned/refund restock → ship fields on edit-to-shipped.
