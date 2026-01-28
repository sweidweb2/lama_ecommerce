## Fragment 2.1 Plan — Auth Foundations (Backend‑First)

This plan gives **step‑by‑step instructions** to complete Fragment 2.1.  
Follow the sections in order.

---

## 1. Supabase Auth Configuration (Dashboard)

### 1.1 Open the Supabase project

1. Go to the Supabase web UI.
2. Select your project that is connected to this repo.

### 1.2 Enable email/password auth

1. In the left sidebar, go to **Authentication → Providers**.
2. Under **Email**, ensure:
   - **Enable email provider** is **ON**.
3. Save changes if needed.

### 1.3 Configure email confirmation

1. Still under **Authentication → Providers → Email** (or **Auth → Settings → Email** depending on UI version):
   - Find the option **Email confirmations** / **Confirm email**.
   - Set it to **ON (required)**.
2. This means:
   - New users must click the email verification link before being fully active.

### 1.4 Configure redirect URLs

1. Go to **Authentication → URL Configuration** (may be under **Auth → Settings → URL configuration**).
2. Add the following URLs in the appropriate fields:
   - **Site URL**: your local dev URL (e.g. `http://localhost:3000`)
   - **Redirect URLs** (depending on Supabase UI):
     - Add: `http://localhost:3000/auth/callback`
     - Add your future production URL (e.g. `https://your-domain.com/auth/callback`) if known.
3. Save changes.

### 1.5 Set password rules

1. In **Authentication → Policies** or **Settings → Passwords**:
   - Set **minimum password length** (e.g. 8 or 10).
   - Enable requirements for:
     - At least one number.
     - At least one symbol (if you want stricter rules).
2. Save changes.

### 1.6 Quick smoke test

1. From your app, or from Supabase auth tester:
   - Try registering a new user with email/password.
2. Confirm:
   - You can sign up without errors.
   - A confirmation email is sent (if using confirmation).
   - After confirming, you can log in.

**Done when:**
- You have verified sign‑up and login work end‑to‑end at least once.

---

## 2. Profile Auto‑Creation Trigger

The goal: **whenever a new row is created in `auth.users`, automatically create a row in `public.profiles`.**

### 2.1 Verify `profiles` table and `profile_role` enum

1. In Supabase SQL editor or Table Editor:
   - Confirm the table `public.profiles` exists with at least:
     - `id uuid primary key`
     - `user_id uuid unique references auth.users(id)`
     - `full_name text` (nullable)
     - `role profile_role not null default 'user'`
     - `created_at timestamptz default now()`
2. Confirm the enum type:
   - `profile_role` with values `'user'`, `'admin'` (and optionally `'super_admin'`).
3. If anything is missing, update the migration / table before continuing.

### 2.2 Create SQL function `handle_new_user`

1. Open **Supabase SQL Editor**.
2. Create a new SQL snippet named **“Profile auto‑create function”**.
3. Paste and run something like:

```sql
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'user');

  return new;
end;
$$ language plpgsql security definer;
```

Notes:
- `new.id` is the ID from `auth.users`.
- `raw_user_meta_data->>'full_name'` expects you to send `full_name` in `signUp()` metadata (can be `null`).
- Default role is `'user'`.

Make sure the function:
- Is in the **`public` schema**.
- Uses `security definer` so it can insert into `public.profiles`.

### 2.3 Create trigger on `auth.users`

1. In the same SQL snippet or a new one, create the trigger:

```sql
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_new_user();
```

2. Run the SQL.
3. Verify in **Database → Triggers** (Supabase UI) that:
   - A trigger named `on_auth_user_created` exists on `auth.users`.

### 2.4 Test the trigger

1. Register a **new** user via your app or Supabase Auth tester.
2. In Table Editor for `public.profiles`:
   - Confirm a new row appears with `user_id = auth.users.id`.
   - `role` should be `'user'`.
   - `full_name` should match metadata if you passed it.

**Done when:**
- Every new user registration automatically creates a valid `profiles` row.

---

## 3. Role Model Definition (Backend + Frontend)

### 3.1 Backend role model (database)

1. Ensure your enum in SQL migration is:

```sql
create type profile_role as enum ('user', 'admin');
-- Optional later: add 'super_admin' via ALTER TYPE
```

2. Ensure `profiles.role` column is defined as:

```sql
role profile_role not null default 'user'
```

3. Decide now:
   - Phase 2 only needs `user` and `admin`.
   - `super_admin` can be added in a **later migration** if needed.

### 3.2 Frontend roles constant

1. Create a new file: `lib/constants/roles.ts` (or `constants/roles.ts` if you already have that folder).
2. Add:

```ts
export const ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  // SUPER_ADMIN: 'super_admin', // optional, Phase 3+
} as const;

export type RoleKey = keyof typeof ROLES;
export type RoleValue = (typeof ROLES)[RoleKey];
```

3. Use `ROLES` everywhere instead of hard‑coded strings:
   - In middleware (checking `profiles.role`)
   - In `lib/auth/permissions.ts`
   - In admin UI (e.g. role badges, filters)

### 3.3 Connect `profiles.role` to frontend

1. In your **server code** (e.g. a helper in `lib/supabase/server.ts` or a `getCurrentUser` function), when you fetch the current profile:
   - Select `role` from `profiles`.
   - Map it to `ROLES` if needed.
2. In your **AuthProvider**:
   - Include `role` in the context value.
   - Use it for:
     - Admin route guards
     - Admin UI visibility

**Done when:**
- The DB enum, TS constants, and runtime checks all agree on:
  - Allowed role values
  - How to treat `admin` vs `user`

---

## 4. Final Verification for Fragment 2.1

Before marking Fragment 2.1 complete, manually verify:

- [ ] You can register a new user via the app.
- [ ] That user receives an email (if confirmations are ON) and can log in.
- [ ] A `profiles` row is created automatically for that user.
- [ ] `profiles.role` is `'user'` by default.
- [ ] `ROLES.USER` and `ROLES.ADMIN` are available in the frontend.
- [ ] You can fetch the current profile + role on the server and client.

Once all boxes are checked, Auth foundations for Phase 2 are solid.
