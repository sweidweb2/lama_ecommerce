## Phase 1 – RLS Policies Overview

This document describes the **Row Level Security (RLS)** setup for Phase 1 and lists the exact SQL policies applied in the migrations.

- All tables have RLS **enabled**.
- Default posture is **deny all**, then explicitly allow:
  - Public read where safe (catalog data)
  - Users accessing **only their own data**
  - Public forms (`leads`, `contact_us`) as needed

---

## 1. Publicly Readable Catalog Data

Anyone (including unauthenticated users) can read these tables to browse the storefront.

```sql
create policy "Public read brands"
on brands
for select
using (true);

create policy "Public read categories"
on categories
for select
using (true);

create policy "Public read products"
on products
for select
using (true);

create policy "Public read product images"
on product_images
for select
using (true);

create policy "Public read product variants"
on customised_products
for select
using (true);

create policy "Public read shipping zones"
on shipping_zones
for select
using (true);

create policy "Public read shipping fees"
on shipping_fees
for select
using (true);

create policy "Public read promo codes"
on promo_codes
for select
using (is_active = true);
```

---

## 2. Profiles

Users can only see and update **their own** profile.

```sql
create policy "Users can view own profile"
on profiles
for select
using (auth.uid() = user_id);

create policy "Users can update own profile"
on profiles
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

---

## 3. User Addresses

Users fully manage only their own addresses.

```sql
create policy "Users can manage own addresses (select)"
on user_addresses
for select
using (auth.uid() = user_id);

create policy "Users can manage own addresses (insert)"
on user_addresses
for insert
with check (auth.uid() = user_id);

create policy "Users can manage own addresses (update)"
on user_addresses
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage own addresses (delete)"
on user_addresses
for delete
using (auth.uid() = user_id);
```

---

## 4. Wishlist

Each user sees and manages only their own wishlist.

```sql
create policy "Users can view own wishlist"
on wishlists
for select
using (auth.uid() = user_id);

create policy "Users can add to wishlist"
on wishlists
for insert
with check (auth.uid() = user_id);

create policy "Users can remove from wishlist"
on wishlists
for delete
using (auth.uid() = user_id);
```

---

## 5. Carts & Cart Items

Cart access is tied to `user_id` for authenticated flows.

```sql
create policy "Users can view own carts"
on carts
for select
using (user_id = auth.uid());

create policy "Users can create own carts"
on carts
for insert
with check (user_id = auth.uid());

create policy "Users can update own carts"
on carts
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can view own cart items"
on cart_items
for select
using (
  exists (
    select 1
    from carts c
    where c.id = cart_items.cart_id
      and c.user_id = auth.uid()
  )
);

create policy "Users can add own cart items"
on cart_items
for insert
with check (
  exists (
    select 1
    from carts c
    where c.id = cart_id
      and c.user_id = auth.uid()
  )
);

create policy "Users can update own cart items"
on cart_items
for update
using (
  exists (
    select 1
    from carts c
    where c.id = cart_id
      and c.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from carts c
    where c.id = cart_id
      and c.user_id = auth.uid()
  )
);

create policy "Users can delete own cart items"
on cart_items
for delete
using (
  exists (
    select 1
    from carts c
    where c.id = cart_id
      and c.user_id = auth.uid()
  )
);
```

---

## 6. Reviews

Approved reviews are public; users can manage only their own reviews.

```sql
create policy "Public read approved reviews"
on reviews
for select
using (review_status = 'approved'::review_status);

create policy "Users can manage own reviews (insert)"
on reviews
for insert
with check (auth.uid() = user_id);

create policy "Users can manage own reviews (select/update/delete)"
on reviews
for all
using (auth.uid() = user_id);
```

---

## 7. Product Questions & Answers

Questions are partially public, answers are fully public.

```sql
create policy "Public read approved questions"
on product_questions
for select
using (is_approved = true);

create policy "Users can create own questions"
on product_questions
for insert
with check (auth.uid() = user_id);

create policy "Users can view own questions"
on product_questions
for select
using (auth.uid() = user_id);

-- Answers are typically admin-only; allow read to all
create policy "Public read answers"
on product_answers
for select
using (true);
```

---

## 8. Orders & Order Items

Users see and create only their own orders; order items are scoped via orders.

```sql
create policy "Users can view own orders"
on orders
for select
using (auth.uid() = user_id);

create policy "Users can create own orders"
on orders
for insert
with check (auth.uid() = user_id);

-- Updates are typically admin-driven; keep locked down by default

create policy "Users can view own order items"
on order_items
for select
using (
  exists (
    select 1
    from orders o
    where o.id = order_items.order_id
      and o.user_id = auth.uid()
  )
);
```

---

## 9. Payments

Users can see payments only for their own orders.

```sql
create policy "Users can view own payments"
on payments
for select
using (
  exists (
    select 1
    from orders o
    where o.id = payments.order_id
      and o.user_id = auth.uid()
  )
);

-- Inserts/updates typically come from backend / webhooks (service role).
```

---

## 10. Shipments

Shipment visibility is also tied to the owning order.

```sql
create policy "Users can view own shipments"
on shipments
for select
using (
  exists (
    select 1
    from orders o
    where o.id = shipments.order_id
      and o.user_id = auth.uid()
  )
);
```

---

## 11. Leads & Contact

Public can submit forms; reading is restricted.

```sql
create policy "Public can insert leads"
on leads
for insert
with check (true);

create policy "Public cannot read leads"
on leads
for select
using (false);

create policy "Public can create contact messages"
on contact_us
for insert
with check (true);

-- Users can see their own messages by email match (best-effort, non-secure)
create policy "Users can read own contact messages by email"
on contact_us
for select
using (email = current_setting('request.jwt.claims', true)::jsonb->>'email');
```
