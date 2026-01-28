## Fragment 2.1 — Auth Foundations (Backend‑First)

**Goal:** Make Supabase Auth and `profiles` work together correctly.

---

### 2.1.1 Supabase Auth Configuration

Configure this in the **Supabase Dashboard**.

- **Enable**
  - Email/password auth
- **Decide**
  - Email confirmation: **ON** (recommended)
- **Configure**
  - Redirect URLs (local + production)
  - Password rules:
    - Minimum length
    - Require numbers/symbols

**✅ Output**

- Auth is enabled and tested
- Users can sign up / log in via Supabase

---

### 2.1.2 Profile Auto‑Creation on Signup (Critical)

**Why:** `auth.users` ≠ application user. Your app logic should use the `profiles` table with a `role` column.

You already have:
- `profiles` table
- `role` column

You need a **trigger** that:

- **Responsibility**
  - On `auth.users` `INSERT`
  - Create a corresponding row in `public.profiles`

- **Parts**
  - SQL function (e.g. `handle_new_user()`)
  - Trigger on `auth.users` after insert

**✅ Output**

- Every new user automatically gets a profile row
- No frontend hacks to “sync” profile creation

---

### 2.1.3 Role Model Definition

**Backend**

- `profile_role` enum already exists
- Roles:
  - `user`
  - `admin`
  - (optional later) `super_admin`

**Frontend**

Create `constants/roles.ts`:

```ts
export const ROLES = {
  USER: 'user',
  ADMIN: 'admin',
} as const;
```

**✅ Output**

- Single source of truth for roles (DB + TS constants)
- Easy to reuse in middleware, permissions, and UI