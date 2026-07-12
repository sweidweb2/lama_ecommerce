## Phase 6 – Shipment & Shipping Flow

This document explains how **shipping addresses, shipping logic, and shipments** should work, and how they relate to `orders.status`.

It focuses on:
- How to **store the shipping address** used for an order
- How to **calculate shipping fees and delivery estimates**
- How to **track shipments** without polluting business logic
- Where **order status** is actually stored

---

## 1. What Is `orders.shipping_address_id`?

**Short answer:**  
It points to the **exact address used for that order**, not just “one of the user’s addresses.”

Reference:

```text
orders.shipping_address_id → user_addresses.id
```

### Why This Matters

Users can:
- Change addresses later
- Delete addresses
- Edit addresses

But:
- **Orders must stay historically correct.**

We want the order to always show:

> “This order was shipped to THIS address.”

### Flow (Address Selection)

1. User has multiple saved addresses.
2. At checkout, user selects one.
3. That selected `user_addresses.id` is stored as `orders.shipping_address_id`.
4. Even if the user later edits or deletes addresses, the **order still references the original one**.

### Frontend Point of View

What the API returns for an order:

```ts
order = {
  id,
  shipping_address: {
    country,
    city,
    street,
    phone,
  },
}
```

Properties:
- ✅ Simple
- ❌ No guessing
- ❌ No recalculating the shipping destination later

---

## 2. Why Shipping Looks “Complicated” (But Isn’t)

It may seem like there are many tables, but this is just **separation of concerns**.

Real‑life questions vs database tables:

| Real life question       | Database concept   |
|--------------------------|--------------------|
| Where am I shipping?     | `shipping_zones`   |
| How much does it cost?   | `shipping_zones` or `shipping_fees` |
| Has it been shipped yet? | `shipments`        |

You **don’t** use all of these at once on the frontend.  
Each table solves a specific problem.

---

## 3. Shipping Flow (Human Version)

### At Checkout Time (Customer)

User only:
- Selects a **shipping address**
- Sees:
  - Shipping fee
  - Estimated delivery
- Confirms the order

No tracking, no carriers, no logistics complexity yet.

### After Checkout (Admin / Ops)

Admin:
- Prepares the order
- Ships the package
- Enters:
  - Carrier name
  - Tracking number

Customer:
- Sees tracking info on the order details page.

---

## 4. What Each Shipping‑Related Table Is For

### 4.1 `shipping_zones`

**Question answered:**  
> “Where are we shipping?”

Example structure:

```text
shipping_zones
- id
- name                -- e.g. "Lebanon", "GCC", "International"
- estimated_delivery  -- e.g. "2–4 business days"
- fee                 -- (Phase 1: a single flat fee per zone)
```

**Why it exists:**
- Shipping rules differ by region
- Easy to add new countries/regions later
- Admin‑configurable

**Frontend usage example:**

> “Shipping to Lebanon – Estimated delivery: 2–4 days – Fee: $5”

---

### 4.2 `shipping_fees` (Optional / Later)

In a more advanced version, you might split fees into a separate table:

```text
shipping_fees
- id
- zone_id
- fee_type   -- 'fixed' | 'weight'
- amount
```

**Phase 1 reality:**
- You will probably just use:
  - `fee_type = 'fixed'`
  - `amount = 5` (for example)
- Weight‑based logic can come later.

**Frontend view:**

> “Shipping fee: $5”

For **Phase 1**, you can **skip `shipping_fees`** and keep the fee directly on the zone (see Section 5).

---

### 4.3 `shipments`

**Question answered:**  
> “Has the order been shipped yet, and how?”

Example structure:

```text
shipments
- id
- order_id
- carrier_name
- tracking_number
- status         -- optional, logistics-level status
```

**Why NOT put all of this into `orders`?**

Because:
- `orders` = **commerce/business state**
- `shipments` = **logistics/physical delivery**

Some orders may be:
- Not shipped yet
- Returned
- Later split into multiple packages (Phase 2+)

**Frontend example:**

> Order status: `shipped`  
> Carrier: `DHL`  
> Tracking: `123456`

---

## 5. Phase 1 – Minimal, Practical Design

If you want **maximum simplicity** in Phase 1, use this minimal setup:

### Keep

**`orders`**

```text
orders
- id
- shipping_address_id
- shipping_fee
```

**`shipping_zones`**

```text
shipping_zones
- id
- name
- estimated_delivery
- fee           -- flat fee for this zone
```

**Optional but nice: `shipments`**

```text
shipments
- id
- order_id
- tracking_number
- carrier_name
```

### Remove / Defer for Now

- ❌ `shipping_fees` as a separate table (merge fee into `shipping_zones`)
- ❌ Weight‑based or complex pricing logic

This gives you:
- Simple schema
- Enough flexibility for Phase 1
- Space to expand in Phase 2 without refactors

---

## 6. Frontend Checkout Flow (Very Clear)

### Step 1 – Select Address

```ts
selectAddress(addressId)
```

### Step 2 – Backend Calculates Shipping

Pseudo‑logic:

```ts
const zone = getZoneByCountry(address.country);
const shippingFee = zone.fee;
```

### Step 3 – Show Summary

Example object:

```ts
{
  subtotal: 120,
  shipping: 5,
  total: 125,
}
```

### Step 4 – Create Order

```ts
createOrder({
  shipping_address_id,
  shipping_fee,
  total,
});
```

✅ Done. Order now has:
- A **fixed shipping fee**
- A **fixed shipping address reference**
- Zone logic encapsulated on the backend

---

## 7. Why This Design Is Good (Not Overkill)

Benefits:
- ✔ Scales later (add weight, carriers, more zones)
- ✔ Simple frontend integration
- ✔ Clean separation of concerns
- ✔ Matches real‑world business flow
- ✔ No breaking refactors needed in Phase 2

This is **not fake future‑proofing**:
- You keep it **simple now**
- You are still **future‑ready**
- Your frontend remains **straightforward**

---

## 8. Where Is Order Status Tracked?

Your question:

> “So where is the order status being tracked from? Which table? `pending`, `shipped`, ...?”

### Single Source of Truth

Order status is tracked in **one place only**:

```text
orders.status
```

Example `orders` structure:

```text
orders
------
- id
- status   -- source of truth
```

Example values:
- `pending`
- `processing`
- `packed`
- `shipped`
- `delivered`
- `returned`
- `cancelled`

🔑 **Rule:**  
`orders.status` is the **only** place that holds business‑level order status.

Everything else (including `shipments`) is **supporting data**, not the driver.

---

## 9. Then What Is `shipments` For?

`shipments` is **not** for order status logic.

It exists to answer **logistics questions**, such as:
- Who shipped the order?
- What is the tracking number?
- Which carrier is used?
- What is the shipment progress?

Example:

```text
shipments
---------
- order_id
- carrier_name
- tracking_number
- status         -- optional, e.g. 'in_transit', 'delayed'
```

---

## 10. How Orders and Shipments Work Together

Mental model:

- **Order** = business state (what stage of the lifecycle the order is in)
- **Shipment** = physical delivery info (how it’s being moved in the real world)

### Example Lifecycle

1️⃣ Order created  
```text
orders.status = 'pending'
```

Frontend:
- “Order placed – waiting for confirmation”

2️⃣ Admin confirms order  
```text
orders.status = 'processing'
```

3️⃣ Admin packs order  
```text
orders.status = 'packed'
```

4️⃣ Admin ships order  
```text
orders.status = 'shipped'
shipments.tracking_number = 'DHL123'
shipments.carrier_name = 'DHL'
```

Frontend:
- Status: `shipped`
- Tracking: `DHL123`

5️⃣ Order delivered  
```text
orders.status = 'delivered'
```

6️⃣ Optional return  
```text
orders.status = 'returned'
```

---

## 11. What You Should NOT Do

Avoid these anti‑patterns:

- ❌ Don’t calculate order status from `shipments`
- ❌ Don’t duplicate order status in multiple tables
- ❌ Don’t let the frontend “guess” order status from tracking

The frontend should **always** trust:
- `order.status` for business state
- `shipment.*` only for delivery details

---

## 12. Frontend Usage (Very Simple)

**Order list page**

```ts
order.status
```

**Order details page**

```ts
order.status;
shipment?.tracking_number;
shipment?.carrier_name;
```

That’s it. No complicated logic needed on the frontend.

---

## 13. Optional: Status History (Phase 2+)

If you later want a full status audit trail, you can add:

```text
order_status_logs
- id
- order_id
- old_status
- new_status
- changed_by
- created_at
```

This lets you track:
- Who changed status
- When it changed
- Full history for support / audits

But this is **Phase 2+, not required for Phase 1**.

---

## 14. Final Summary

- **Order status** is tracked **only** in `orders.status`.
- **`shipping_address_id`** points to the address used at checkout, ensuring historical correctness.
- **`shipping_zones`** (and optionally `shipping_fees`) model where and how much shipping costs.
- **`shipments`** adds delivery details (carrier, tracking), but does **not** own business state.

This design keeps:
- The schema **simple now**
- The system **correct over time**
- The frontend **easy to implement**