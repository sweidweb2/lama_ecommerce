## Fragment 2.2 — RLS Policies (Authorization at DB Level)

**Goal:** Database **enforces** access; frontend cannot bypass it.

---

### 2.2.1 Profiles RLS

Policies to create on the `profiles` table:

- **User capabilities**
  - Read own profile
  - Update own profile

- **Admin capabilities** (via service role or future admin policies)
  - Read all profiles

- **Super Admin** (optional, Phase 3+)
  - Update roles

**✅ Output**

- Secure profile access
- No accidental “list all users” leaks

---

### 2.2.2 Global Auth Assumptions

Define global rules you will reuse in all RLS policies:

- `auth.uid()` → current authenticated user ID
- User role is read from `profiles.role`
- **Never** trust a role coming from the frontend

**✅ Output**

- Clean mental model for all future RLS
- Consistent pattern across tables