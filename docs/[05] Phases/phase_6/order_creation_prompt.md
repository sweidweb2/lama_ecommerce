✅ Fixed & Improved Prompt (Clear + Actionable)

Checkout Flow – Cart → Order Creation

When the Checkout button is clicked on the Cart page, create a new order and corresponding order_items based on the active cart and its cart_items, for either:

a logged-in user (user_id = auth.uid()), or

a guest user (user_id = NULL, session_id taken from cookie / storage),

according to:

@20260126141860_initial.sql (lines 200–232)

@20260220120003_orders_session_id.sql (lines 10–15)

Order Creation Rules

Guest checkout

Keep orders.user_id = NULL

Set orders.session_id = current_session_id

Logged-in checkout

Set orders.user_id = auth.uid()

orders.session_id may be NULL or kept for reference

Cart handling

After a successful order creation:

Soft-delete the cart

Soft-delete its cart_items

Data Handling

Take shipping fee from the checkout form dropdown (selected shipping zone)

Store address and product data as snapshots

Calculate all monetary values server-side

Validation & Safety

Before creating the order:

Validate product stock

Calculate totals (subtotal, shipping, discount, total)

After validation:

Decrease stock atomically

Payment Handling (Temporary)

Payments are not integrated yet

Show a fake loading modal

On completion:

Redirect back to the Cart page

Cart page should be re-rendered (empty state)

Edge Cases

Handle race conditions

Handle invalid carts

Prevent duplicate checkout submissions

⚠️ What the Developer MUST Take Into Consideration

This is the important part.
If these are ignored, your checkout will break in production.

1️⃣ All Checkout Logic MUST Be Server-Side

❌ Never trust frontend:

prices

totals

stock

shipping fee

✔️ Backend must:

re-fetch cart

re-fetch variants

re-calculate everything

2️⃣ Transaction Is NOT Optional

Checkout must run inside one DB transaction.

Required order:

Lock stock rows

Validate stock

Create order

Create order_items (snapshots)

Decrease stock

Delete cart + cart_items

If any step fails → rollback everything

3️⃣ Stock Validation Rules

For each customised_product_id:

quantity_stock >= cart_item.quantity


If any item fails:

abort checkout

return clear error message

⚠️ Do NOT partially checkout

4️⃣ Stock Decrease Must Be Atomic

Correct pattern:

update customised_products
set quantity_stock = quantity_stock - :qty
where id = :variant_id
and quantity_stock >= :qty;


Then check:

if rows_affected != 1 → fail


This prevents overselling.

5️⃣ Snapshot Rules (CRITICAL)

Never rely on joins after checkout.

order_items must store:

product_name_snapshot

price_snapshot

size_snapshot

color_snapshot

material_snapshot

Because:

product can be edited

variant can be deleted

price can change

6️⃣ Guest vs Logged-In Security
Logged-in user:
cart.user_id = auth.uid()

Guest user:
cart.session_id = session_id_from_cookie


❌ Never allow mixed access
❌ Never accept session_id from request body

7️⃣ Cart Deletion Strategy

Do soft delete, not hard delete:

update carts
set deleted_at = now()
where id = :cart_id;


Same for cart_items.

Why?

Debugging

Audit trail

Support tickets

8️⃣ Prevent Double Checkout (VERY IMPORTANT)

Handle:

Double click

Network retry

Page refresh

Solutions:

Lock cart row

OR mark cart as “checked_out”

OR ensure cart is deleted inside transaction

9️⃣ Shipping Fee Validation

Frontend sends:

shipping_zone_id


Backend:

select fee
from shipping_fees
where zone_id = :shipping_zone_id;


❌ Never accept raw shipping fee from frontend

🔟 Fake Payment Flow (Temporary)

Expected behavior:

Create order with:

payment_status = 'pending'

Show loading modal (3–5 sec)

Redirect to Cart page

Cart refetches → empty state

Later:

This flow will be replaced by real gateway + webhooks

1️⃣1️⃣ Failure Handling (User Experience)

If checkout fails:

Do NOT delete cart

Do NOT decrease stock

Show exact error:

out of stock

invalid cart

session expired

🧠 Mental Model (For the Developer)
Cart (temporary)
   ↓
Order (permanent, immutable)
   ↓
Stock decrease (atomic)
   ↓
Cart removed