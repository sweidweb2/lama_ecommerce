# Phase 1 – Database Design Decisions

This document summarizes the **core database design decisions** that apply consistently across all tables in the e-commerce schema.

These decisions were made to ensure:
- **Consistency** across the entire database
- **Maintainability** and ease of development
- **Production readiness** for e-commerce operations
- **Data integrity** and historical accuracy

---

## 1. ID Strategy

### Decision: UUID Everywhere

**Implementation:**
- All primary keys use `uuid` type
- Generated using `uuid_generate_v4()` (via `uuid-ossp` extension)
- Foreign keys reference UUIDs

**Why:**
- ✅ **No collisions** across distributed systems
- ✅ **Security** (non-sequential, harder to guess)
- ✅ **Works offline** (can generate IDs before insert)
- ✅ **Supabase native** (works seamlessly with auth.users)

**Example:**
```sql
id uuid primary key default uuid_generate_v4()
```

---

## 2. Timestamps

### Decision: `created_at` + `updated_at` Pattern

**Implementation:**
- `created_at timestamptz default now()` on all tables
- `updated_at timestamptz default now()` on tables that need change tracking
- Auto-updated via PostgreSQL triggers

**Tables with `updated_at`:**
- `carts`
- `products`
- `orders`

**Why `timestamptz`:**
- ✅ Stores timezone information
- ✅ Prevents timezone-related bugs
- ✅ Works correctly across global deployments

**Trigger Function:**
```sql
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;
```

---

## 3. Soft Delete

### Decision: ✅ Use `deleted_at` (Recommended for E-commerce)

**Implementation:**
- `deleted_at timestamptz` column on all user-facing tables
- `NULL` = active record
- `NOT NULL` = soft-deleted record

**Why Soft Delete:**
- ✅ **Data recovery** (can restore accidentally deleted items)
- ✅ **Audit trail** (know when/why something was deleted)
- ✅ **Referential integrity** (orders can reference deleted products)
- ✅ **Analytics** (historical data remains intact)
- ✅ **Legal compliance** (may need to retain order data)

**Tables with soft delete:**
- `profiles`
- `user_addresses`
- `brands`
- `categories`
- `products`
- `customised_products`
- `wishlists`
- `cart_items`
- `reviews`
- `orders`
- `order_items`
- `payments`
- `shipments`

**Query pattern:**
```sql
-- Only get active records
select * from products where deleted_at is null;
```

---

## 4. Money / Currency

### Decision: Use `numeric(10,2)` for Monetary Values

**Implementation:**
- All money fields use `numeric(10,2)`
- Stores up to 99,999,999.99 (sufficient for most e-commerce)
- 2 decimal places for cents/currency precision

**Why `numeric` instead of `integer` (cents):**
- ✅ **Readability** (easier to debug: `120.50` vs `12050`)
- ✅ **PostgreSQL native** (no conversion needed)
- ✅ **Precision** (no floating-point errors)
- ✅ **Flexibility** (can handle different decimal places if needed)

**Alternative (if preferred):**
- Store as `integer` (cents): `12050` = $120.50
- Requires conversion in application layer
- More storage efficient but less readable

**Money fields in schema:**
- `products.price`
- `customised_products.price_override`
- `orders.subtotal`, `shipping_fee`, `discount`, `total`
- `order_items.price_snapshot`
- `payments.amount`
- `shipping_fees.fee`
- `promo_codes.discount_value`

---

## 5. Enums vs Lookup Tables

### Decision: Use Enums for Statuses, Tables for Dynamic Data

### ✅ Use Enums For:

**Fixed, rarely-changing status values:**

1. **Order Status** (`orders.status`)
   ```sql
   enum('pending', 'processing', 'packed', 'shipped', 'delivered', 'returned', 'cancelled')
   ```

2. **Payment Status** (`orders.payment_status`, `payments.status`)
   ```sql
   enum('pending', 'paid', 'failed', 'refunded')
   ```

3. **Review Status** (`reviews.review_status`)
   ```sql
   enum('pending', 'approved', 'rejected')
   ```

4. **Contact Status** (`contact_us.status`)
   ```sql
   enum('new', 'read', 'replied', 'resolved')
   ```

5. **User Role** (`profiles.role`)
   ```sql
   enum('user', 'admin')
   ```

6. **Discount Type** (`promo_codes.discount_type`)
   ```sql
   enum('percentage', 'fixed')
   ```

**Why Enums:**
- ✅ **Type safety** (database enforces valid values)
- ✅ **Performance** (faster than JOINs)
- ✅ **Simplicity** (no extra table needed)
- ✅ **Immutable** (statuses don't change often)

### ✅ Use Tables For:

**Dynamic, user-configurable data:**

- `brands` (users can add/remove brands)
- `categories` (hierarchical, user-managed)
- `shipping_zones` (admin-configurable)
- `promo_codes` (created dynamically)

**Why Tables:**
- ✅ **Flexibility** (can add/remove without schema changes)
- ✅ **Relationships** (can link to other data)
- ✅ **Metadata** (can store additional fields)

---

## 6. Additional Design Patterns

### Foreign Key Constraints

**Pattern:**
- Use `on delete set null` for optional relationships
- Use `on delete cascade` for dependent data (e.g., `order_items` → `orders`)

**Example:**
```sql
user_id uuid references auth.users(id) on delete set null
order_id uuid not null references orders(id) on delete cascade
```

### Indexes

**Strategy:**
- Index all foreign keys
- Index frequently queried columns (`status`, `is_active`, `created_at`)
- Composite indexes for common query patterns

**Example:**
```sql
create index idx_products_category_active_price 
  on products(category_id, is_active, price);
```

### Check Constraints

**Use for:**
- Stock quantities (must be >= 0)
- Ratings (must be between 1 and 5)
- Business logic validation

**Example:**
```sql
quantity_stock integer default 0 check (quantity_stock >= 0)
rating integer check (rating between 1 and 5)
```

---

## 7. Schema Validation Checklist

When creating new tables, ensure:

- [ ] Primary key is `uuid` with `uuid_generate_v4()`
- [ ] `created_at timestamptz default now()` exists
- [ ] `updated_at` added if table needs change tracking
- [ ] `deleted_at timestamptz` added for soft delete
- [ ] Money fields use `numeric(10,2)`
- [ ] Status fields use `enum` (if fixed set of values)
- [ ] Foreign keys have appropriate `on delete` behavior
- [ ] Indexes created for foreign keys and frequently queried columns
- [ ] Check constraints added for business rules

---

## Summary

| Decision | Implementation | Rationale |
|----------|---------------|-----------|
| **IDs** | `uuid` everywhere | Security, no collisions, Supabase native |
| **Timestamps** | `created_at` + `updated_at` (via triggers) | Audit trail, change tracking |
| **Soft Delete** | `deleted_at timestamptz` | Data recovery, audit, legal compliance |
| **Money** | `numeric(10,2)` | Precision, readability, no float errors |
| **Statuses** | `enum` | Type safety, performance, simplicity |
| **Dynamic Data** | Tables | Flexibility, relationships, metadata |

These decisions create a **consistent, maintainable, and production-ready** database foundation for the e-commerce platform.
