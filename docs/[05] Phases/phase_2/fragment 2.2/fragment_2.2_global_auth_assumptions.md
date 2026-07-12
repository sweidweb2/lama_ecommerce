# Fragment 2.2: Global Auth Assumptions

This document defines the **global rules** that are reused across all RLS policies and authorization logic in the application.

---

## Core Principles

### 1. Current Authenticated User ID

**Rule:** Use `auth.uid()` to get the current authenticated user's ID.

```sql
-- In RLS policies:
using (auth.uid() = user_id)

-- In application code:
const { data: { user } } = await supabase.auth.getUser();
const userId = user?.id;
```

**Why:** 
- `auth.uid()` is provided by Supabase and is secure
- It returns `null` if user is not authenticated
- Cannot be spoofed by frontend

---

### 2. User Role Source

**Rule:** User role is **always** read from `profiles.role` in the database.

**Never:**
- ❌ Trust a role value sent from the frontend
- ❌ Use `auth.users.raw_user_meta_data->>'role'` for authorization
- ❌ Store role in JWT claims for authorization decisions

**Always:**
- ✅ Query `profiles.role` from the database
- ✅ Use `get_user_role()` helper function in RLS policies
- ✅ Fetch profile via `getCurrentUserProfile()` service

**Example:**
```typescript
// ✅ CORRECT: Read role from database
const profile = await getCurrentUserProfile();
const role = profile?.role; // From profiles table

// ❌ WRONG: Don't trust frontend
const role = request.body.role; // Never do this!
```

---

### 3. Role-Based Authorization Pattern

**Pattern:** Check role in this order:

1. **Server-side (RLS policies):**
   ```sql
   -- Use helper function
   using (public.get_user_role() = 'admin'::profile_role)
   ```

2. **Server-side (application code):**
   ```typescript
   const profile = await getCurrentUserProfile();
   if (profile?.role !== ROLES.ADMIN) {
     throw new Error("Unauthorized");
   }
   ```

3. **Client-side (UI only):**
   ```typescript
   const { role } = useAuth();
   if (canAccessAdmin(role)) {
     // Show admin UI
   }
   ```

**Important:** Client-side checks are for **UI only**. Real security is enforced by:
- RLS policies (database level)
- Server actions/middleware (application level)

---

## Helper Functions

### `get_user_role()` (SQL Function)

**Location:** `supabase/migrations/20261201000000_profiles_rls_policies.sql`

**Purpose:** Get the role of the currently authenticated user.

**Usage in RLS policies:**
```sql
create policy "Admins can read all"
on some_table
for select
using (public.get_user_role() = 'admin'::profile_role);
```

**Returns:**
- `'user'` | `'admin'` if user is authenticated and has a profile
- `'user'` (default) if user not found (safe default)

---

### `getCurrentUserProfile()` (TypeScript Service)

**Location:** `services/profile.service.ts`

**Purpose:** Get the current user's profile (including role) on the server.

**Usage:**
```typescript
const profile = await getCurrentUserProfile();
if (!profile || profile.role !== ROLES.ADMIN) {
  throw new Error("Unauthorized");
}
```

---

### `canAccessAdmin()` (TypeScript Helper)

**Location:** `lib/auth/permissions.ts`

**Purpose:** Check if a role has admin access (client or server).

**Usage:**
```typescript
// Server
const profile = await getCurrentUserProfile();
if (!canAccessAdmin(profile?.role)) {
  throw new Error("Unauthorized");
}

// Client
const { role } = useAuth();
if (canAccessAdmin(role)) {
  // Show admin UI
}
```

---

## Security Layers

The application uses **multiple layers** of security:

1. **Database (RLS):** Enforces access at the SQL level
2. **Middleware:** Protects routes before page loads
3. **Server Actions:** Validates permissions before operations
4. **UI (Client):** Hides/shows UI based on permissions (UX only)

**Rule:** Each layer should independently verify permissions. Never skip a layer.

---

## Common Patterns

### Pattern 1: User Owns Resource

```sql
-- RLS Policy
create policy "Users can access own resource"
on some_table
for select
using (auth.uid() = user_id);
```

### Pattern 2: Admin Can Access All

```sql
-- RLS Policy (Phase 3+)
create policy "Admins can access all"
on some_table
for select
using (
  auth.uid() = user_id  -- Own resources
  or public.get_user_role() = 'admin'::profile_role  -- Or admin
);
```

### Pattern 3: Public Read, Authenticated Write

```sql
-- RLS Policy
create policy "Public can read"
on some_table
for select
using (true);

create policy "Users can insert own"
on some_table
for insert
with check (auth.uid() = user_id);
```

---

## Anti-Patterns (Never Do This)

### ❌ Trust Frontend Role

```typescript
// NEVER DO THIS
const role = request.body.role;
if (role === 'admin') {
  // Allow admin operation
}
```

### ❌ Skip RLS Checks

```typescript
// NEVER DO THIS
// Assuming middleware already checked, so skip server check
await supabase.from('profiles').select('*'); // No RLS check!
```

### ❌ Use JWT Claims for Authorization

```typescript
// NEVER DO THIS
const role = jwt.claims.role; // Don't trust JWT for auth decisions
```

---

## Summary

- ✅ Use `auth.uid()` for current user ID
- ✅ Always read role from `profiles.role` in database
- ✅ Never trust role from frontend
- ✅ Use helper functions: `get_user_role()`, `getCurrentUserProfile()`, `canAccessAdmin()`
- ✅ Enforce security at multiple layers (RLS, middleware, server actions)
- ✅ Client-side checks are for UI only, not security

---

**Last Updated:** Fragment 2.2 Implementation
**Next Steps:** Phase 3 - Add admin RLS policies using `get_user_role()`
