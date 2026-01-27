## Phase 6 – Order Flow Logic

This document explains **how carts, orders, and order items should work** in your ecommerce system, and **why snapshot data in `order_items` is required** for correctness over time.

It is written to be:
- A **design reference** (for schema and flows)
- A **mental model** (how to think about carts vs orders)
- A **practical guide** (what to actually implement)

---

## 1. Cart vs Order – Mental Model

Think of these as **two completely different concepts**:

| Concept | Meaning                           |
|--------|------------------------------------|
| Cart   | Temporary, editable, unsafe state |
| Order  | Permanent, auditable, immutable   |

### Cart

The cart is a **working copy** of what the user might buy:
- User can **add / remove items**
- User can **change quantities**
- User can **abandon it**
- **Price may change** between now and checkout
- **Stock may change**
- **Promo codes may expire**

The cart is **not a legal document**. It’s just UX state.

### Order

The order represents a **legal, business transaction**:
- Must **never change after creation**
- Used for:
  - Invoices
  - Refunds
  - Accounting
  - Customer support
  - Analytics / reporting

👉 **Key rule:** `cart ≠ order`  
You must never treat the cart as the source of truth for historical data.

---

## 2. Why `order.cart_id` Is Tempting (But Risky)

You might start with a draft like:

```text
orders
- cart_id
- status
- subtotal
- total
- payment_id
- fee_id
- promo_id
- address
- shipping_status
```

This **feels** logical: “Just link the order to the cart and reuse it.”

But there are hidden problems.

### Problem 1 – Cart Is Mutable

If the cart changes after checkout (for any reason):
- User session reuse
- Admin debug tools
- Bugs

➡️ Your order data becomes **incorrect**.

### Problem 2 – You Lose History

After the order is placed, the world continues to change:
- Product price changes tomorrow
- Product is deleted
- Variant stock or attributes change

But your order must still always answer:

> “User bought **THIS item** at **THIS price** on **THIS date**.”

Relying on `cart_id` (or live product tables) **cannot guarantee that**.

### Problem 3 – Cart May Not Exist Later

Situations where carts disappear:
- Guest carts
- Session expiration
- Cleanup / cron jobs

Orders must **outlive** carts.  
Your long‑term source of truth cannot depend on a temporary table.

---

## 3. Why `order_items` Exists (Key Insight)

Conceptually:

```text
Cart structure
cart
└── cart_items

Order structure
order
└── order_items
```

They **look similar**, but they represent **different moments in time**.

### What `order_items` Actually Is

`order_items` is a **snapshot copy** of the cart **at the time of checkout**:

- `product_variant_id`
- `price at time of purchase`
- `quantity at time of purchase`

Example structure:

```text
order_items
- order_id
- product_variant_id
- product_name_snapshot
- variant_snapshot      -- size/color/material
- unit_price_snapshot
- quantity
```

👉 Even if the product or variant is deleted or changed later,  
   the **order stays valid** and historically accurate.

---

## 4. Correct Checkout Flow (Step‑by‑Step)

This is the **canonical flow** used by Shopify, Amazon, and most Stripe‑based stores.

### Step 1 – User Builds Cart

Tables used:
- `carts`
- `cart_items`

Nothing permanent yet.  
This is still **UX state**, not a business record.

### Step 2 – User Clicks “Checkout”

System performs validations:
- Validate **stock**
- Validate **promotions / discounts**
- Calculate **totals**

Still no `order` yet.

### Step 3 – Payment Intent Starts

Examples:
- Create Stripe Payment Intent
- Mark COD (cash on delivery) as **pending**

You might:
- Still have no order, or
- Have `orders.status = 'pending'`

### Step 4 – Create ORDER (Critical Moment)

This is when the transaction becomes **real**:

1. Create `orders` row
2. Copy `cart_items` → `order_items` (as **snapshots**)
3. Freeze **prices** and **quantities**
4. Link **payment**

Conceptually:

```text
orders
└── order_items (snapshot of cart at checkout time)
```

💥 At this point:
- **Cart is no longer relevant**
- **Order becomes the only source of truth**

### Step 5 – Fulfillment & Shipping

From here on, only:
- `orders`
- `order_items`

are used for:
- Packing
- Shipping
- Invoices
- Refunds

---

## 5. Recommended Order Schema

This is a clean, production‑ready version of the schema.

### `orders` table

```text
orders
- id
- user_id
- status            -- processing, packed, shipped, delivered
- payment_status    -- pending, paid, failed
- subtotal
- shipping_fee
- discount
- total
- address_snapshot  -- JSON (🔥 important, snapshot)
- promo_id
- created_at
```

⚠️ **Address MUST be a snapshot, not a foreign key**  
People change or delete addresses. Invoices must remain historically correct.

### `order_items` table

```text
order_items
- id
- order_id
- product_variant_id
- product_name_snapshot
- variant_snapshot     -- size/color/material
- unit_price_snapshot
- quantity
```

### `payments` table

```text
payments
- id
- order_id
- method
- status
- transaction_ref
```

---

## 6. What Happens to the Cart After Order Creation

After a successful order:

You either:
- ❌ **Delete** the cart, or
- ✅ Mark cart as `converted_to_order = true`

But you **never again** use the cart as a data source for:
- Invoices
- Refunds
- Analytics
- Accounting

Only `orders` + `order_items` matter after this point.

---

## 7. Visual Flow (High‑Level)

```text
Cart (temporary)
  └── Cart Items
          |
          | checkout
          ↓
Order (permanent)
  └── Order Items (snapshot)
          |
          | fulfillment
          ↓
Shipment / Invoice / Refund
```

---

## 8. Why Snapshots in `order_items` If We Have `product_variant_id`?

You might reasonably ask:

> “Why store duplicated snapshot data if I can always JOIN using `product_variant_id`?”

On the surface, that seems correct.  
But snapshots are not about convenience, they’re about **truth over time**.

### 8.1 The Risky Assumption

Implicit assumption:

```text
product_variant_id  →  product + price + attributes (forever)
```

So later you think:

> “I can just JOIN and I’ll always get the correct data.”

This is **only true at the moment of purchase**, not in the future.

### 8.2 What Changes After an Order Is Placed?

Real‑world scenarios that **will** happen:

**Price changes**
- Admin updates price
- Discount periods end
- Currency adjustments

**Product cleanup**
- Product deleted
- Variant deleted
- Brand removed

**Product edits**
- Name updated (`"Nike Air Zoom"` → `"Nike Zoom X"`)
- Color renamed
- Sizes system changed

**Emergency fixes**
- Wrong price corrected
- Wrong SKU merged
- Variant replaced

👉 If you rely only on `product_variant_id`, your **historical orders change retroactively**.  
That is **financially and legally wrong**.

---

## 9. What “Snapshot” Actually Means

Snapshot ≠ clone the whole product.  
Snapshot = **freeze only the business‑critical fields** at checkout.

Minimum useful snapshot fields:

- `product_name_snapshot`
- `variant_snapshot` (size/color/material)
- `unit_price_snapshot`

That’s enough to:
- Render invoices
- Show order history
- Handle refunds

---

## 10. Concrete Example

**Day 1 – User places order**

- `product_variant_id`: `42`
- Product: `"Leather Jacket"`
- Color: `Black`
- Price: `$120`

Stored in `order_items`:

```text
order_items:
- product_variant_id = 42
- product_name_snapshot = "Leather Jacket"
- variant_snapshot = "Black / L"
- unit_price_snapshot = 120
```

**Day 10 – Admin updates product**

- Product renamed → `"Premium Leather Jacket"`
- Price updated → `$150`

**Day 30 – User downloads invoice**

Without snapshots (JOIN only):

- Product name → `"Premium Leather Jacket"`
- Price → `$150` ❌ (**wrong** – user never agreed to this price)

With snapshots:

- Product name → `"Leather Jacket"`
- Price → `$120` ✅ (**correct**)

👉 That is the entire purpose of snapshots.

---

## 11. Why Not Just “Lock” Product Tables?

You might think:

> “What if I never change product prices or details?”

That breaks the moment you:
- Add discounts
- Add sales
- Add VAT / tax logic
- Expand to new regions / currencies
- Fix a mistake in the catalog

Real systems assume **constant change**, not perfection.

---

## 12. Industry Rule of Thumb

This is standard in ecommerce and accounting systems:

- **Orders must be immutable and self‑contained**

Platforms that follow this pattern:
- Shopify
- Magento
- WooCommerce
- Stripe invoices

---

## 13. Hybrid Approach – Best of Both Worlds

You should store **both**:

| Field               | Purpose                                   |
|---------------------|-------------------------------------------|
| `product_variant_id`| Internal reference, refunds, analytics    |
| Snapshot fields     | Legal truth, invoices, history correctness|

They serve **different responsibilities**:
- FK for **relations**
- Snapshot for **truth over time**

---

## 14. When Is It OK to Skip Snapshots?

Only if your system has:
- No payments  
- No invoices  
- No refunds  
- No accounting  
- No audits  

➡️ In other words: **not a real ecommerce store**.

---

## 15. Final Mental Models

Memorize these:

- **Foreign keys are for relations**
- **Snapshots are for truth over time**

### Minimal Safe `order_items` Schema

If you want the **leanest safe** version, use:

```text
order_items
- order_id
- product_variant_id
- title_snapshot
- variant_snapshot
- unit_price_snapshot
- quantity
```

Nothing more. Nothing less.

This gives you:
- Stable invoices
- Accurate history
- Flexibility to evolve your catalog schema without breaking old orders
