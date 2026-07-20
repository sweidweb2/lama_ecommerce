# Hard Deletes

**Convention:** rows are permanently removed with `.delete()` (or SQL `DELETE`). There is no `deleted_at` column.

**Profiles:** use `is_active boolean` (default `true`). Inactive users are blocked from `/account` and `/profile` in middleware. Admin status Active/Inactive maps to `is_active`; profile hard-delete UI stays disabled.

---

## Delete rules (FK pre-checks)

| Entity | Behavior |
|--------|----------|
| **Cart** | Always OK. Cart items cascade with the cart. |
| **Cart item** | Always OK (hard delete). |
| **Order** | Always OK for admin. Payments, shipments, and order items cascade. If `stock_restored` is false, cancel first so the restock trigger runs, then delete. |
| **Product** | Clear `product_views` / `product_stats` then delete. Refuse if `product_questions` exist, or variants are referenced by wishlists/cart_items/order_items. Images/variants/reviews cascade. |
| **Variant** | Refuse if wishlists or cart_items reference it. |
| **Category** | Re-parent children first, then refuse if products still link to it. |
| **Brand** | Refuse if products still reference it. |
| **Review / Address** | Always OK. |
| **Wishlist** | Hard delete on remove (no soft-delete). |

Postgres `23503` (FK violation) is caught as a fallback with a clear error when a pre-check is missed.

---

## Special flows

1. **Checkout (`process_checkout`)** — after creating the order and decrementing stock, hard-deletes the cart (items cascade).
2. **Guest cart merge** — hard-deletes the discarded guest cart via `deleteCartAdmin`.
3. **Category delete** — re-parents children, then hard-deletes if no products remain.
4. **Profiles** — inactive = `is_active = false` (reversible). Dedicated user delete dialog stays disabled.
5. **Order delete** — if stock was never restored, set status to `cancelled` (restock trigger), then hard-delete; payments/shipments/items cascade.

---

## Admin UI

- No “Show deleted” toggles (orders, categories, brands, carts).
- Users: Active/Inactive from `is_active`; delete dialog disabled / status-only.
- Order delete enabled on detail; cascades payments/shipments/items.
