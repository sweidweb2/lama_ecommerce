## Phase 3 – RBAC Logic (Role-Based Access Control)

This document explains **why** you need RBAC, what it adds beyond `role === "admin"`, and how to implement a **lightweight but powerful** RBAC model for your ecommerce admin.

Goals:
- Keep Phase 1 simple
- Avoid a painful refactor later
- Centralize permission rules for both **frontend** and **backend**

---

## 1. What You’re Doing Now (And Why It’s OK Early)

Current pattern (simplified):

```ts
if (user.role === "admin") {
  // allow
} else {
  // block
}
```

Frontend:
- You hide buttons
- You don’t render admin pages
- You block API routes

This is **totally fine** when:
- You only have **one admin**
- Admins can do **everything**
- No staff, no delegation, no growth yet

For **very early Phase 1**, this is acceptable. 👍  
But it will not scale.

---

## 2. What RBAC Actually Adds

RBAC = **Role‑Based Access Control**.

It changes the question from:
- ❌ “Is this user an admin?”
to:
- ✅ “**What exactly is this user allowed to do?**”

Instead of a single boolean (`isAdmin`), you model **capabilities**.

---

## 3. Real‑World Admin Scenario (This Will Happen)

Imagine your store grows and you hire:

| Person            | Should they be able to…                                  |
|-------------------|----------------------------------------------------------|
| Warehouse staff   | ✅ Update order status &nbsp;&nbsp; ❌ Edit products      |
| Content editor    | ✅ Manage banners &nbsp;&nbsp; ❌ Issue refunds           |
| Customer support  | ✅ View orders &nbsp;&nbsp; ❌ Cancel orders              |
| Marketing         | ✅ Create promo codes &nbsp;&nbsp; ❌ Touch payments      |

With your current logic:

```ts
if (user.role === "admin") { /* full access */ }
```

You either:
- Give **too much power**, or
- Create 5 different “fake admin” roles, or
- Hardcode a mess of conditions everywhere.

All of those are painful.

---

## 4. What RBAC Gives You (In Practice)

### 4.1 Fine‑Grained Control (Without Redeploys)

Instead of:

```ts
if (user.role === "admin") {
  // ...
}
```

You do:

```ts
if (hasPermission("manage_products")) {
  // ...
}
```

Later, you can:
- Change which roles have `manage_products` **in the database**
- Without:
  - Redeploy
  - Changing frontend code

### 4.2 Cleaner Backend Logic

Without RBAC, you end up with:

```ts
if (
  user.role === "admin" ||
  user.role === "support" ||
  user.role === "manager"
) {
  // allow
}
```

With RBAC:

```ts
can(user, "update_order_status");
```

Much cleaner. Much safer.

### 4.3 Frontend + Backend Consistency

You already:
- Hide buttons in the frontend (good UX 👍)

But **security must live in the backend**.

RBAC lets you:
- Use the **same permission keys**:
  - In the frontend → **hide UI**
  - In the backend → **enforce access**

> One rule, used in two places.

---

## 5. Minimal RBAC Model (Not Overkill)

You don’t need an enterprise policy engine.  
You just need a **simple, explicit model**.

### 5.1 Roles (Example)

```text
roles
- id
- key          -- 'super_admin' | 'admin' | 'staff'
```

Example role keys:
- `super_admin`
- `admin`
- `staff`

### 5.2 Permissions (Example)

```text
permissions
- id
- key          -- 'manage_products' | 'manage_orders' | ...
```

Example permission keys:
- `manage_products`
- `manage_orders`
- `update_order_status`
- `manage_users`
- `manage_promotions`
- `manage_content`
- `view_reports`

### 5.3 Role → Permission Mapping

Join table:

```text
role_permissions
- role_id
- permission_key
```

Conceptually:

| Role         | Permissions                              |
|--------------|------------------------------------------|
| super_admin  | **ALL**                                  |
| admin        | products, orders, promos                 |
| staff        | `view_orders`, `update_order_status`     |

This can live entirely in the database and be editable via an admin UI later.

---

## 6. How This Looks in Your Code

### Frontend

```ts
if (permissions.includes("manage_products")) {
  showAddProductButton();
}
```

### API / Server Action

```ts
if (!permissions.includes("manage_products")) {
  throw new Error("Unauthorized");
}
```

Or with a helper:

```ts
if (!can(user, "manage_products")) {
  throw new Error("Unauthorized");
}
```

Same permission key everywhere.

---

## 7. Supabase + RLS Advantage 🔥

Supabase + Row Level Security (RLS) works **beautifully** with RBAC.

Example policy:

```sql
USING (
  EXISTS (
    SELECT 1
    FROM role_permissions rp
    WHERE rp.permission_key = 'manage_products'
    AND rp.user_id = auth.uid()
  )
);
```

This means:
- Even if someone bypasses your frontend
- Even if they hit your API directly

👉 The **database itself** says **NO**.  
That’s a huge security win.

---

## 8. When You SHOULD Use RBAC

Use RBAC if any of these are true:
- You will have **staff**
- You will **delegate** tasks
- You want **audit safety**
- You want **future‑proofing**
- You don’t want permission logic **scattered everywhere**

Your project **already** hits most of these.

---

## 9. When You Can Skip It (For Now)

You can skip RBAC **temporarily** if:
- Only **you** are admin
- You expect **no staff for 6–12 months**
- You accept doing a **big refactor later**

But:
- Refactoring auth/permissions later is **painful**.

---

## 10. Recommendation for This Project

**Do this now (lightweight RBAC):**

- `roles` table
- `permissions` table
- `role_permissions` mapping table
- Helper: `can(user, permissionKey)` (backed by Supabase queries)

**Do NOT do this (over‑engineering):**
- No complex policy engines
- No nested roles
- No crazy inheritance trees

Keep it:
- Explicit
- Simple
- Centralized
