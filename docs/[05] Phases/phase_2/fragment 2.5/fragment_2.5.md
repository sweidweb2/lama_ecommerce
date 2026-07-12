## Fragment 2.5 — Route Protection & Permissions

**Goal:** Block access **before** a protected page loads (edge/middleware level).

---

### 2.5.1 Middleware Setup

Create a root `middleware.ts` in the project:

```text
middleware.ts
```

**Routing rules:**

- `(public)` → public (no auth required)
- `(useraccount)` → **authenticated** users only
- `admin` → **admin role** only

**Checks performed by middleware:**

- JWT validity (session present and not expired)
- User exists in `profiles`
- User `role` matches route requirements

**✅ Output**

- Unauthorized users never reach protected pages
- Clean separation between public, user, and admin areas

---

### 2.5.2 Permission Utilities

Create permission helpers:

```text
lib/auth/permissions.ts
```

**Example helpers:**

```ts
canAccessAdmin(role: string): boolean;
canEditProfile(userId: string, authUserId: string): boolean;
```

**Used in:**

- UI guards (show/hide buttons, links, admin sections)
- Server actions / route handlers (final authorization check)

**✅ Output**

- One central place for business‑level permission logic