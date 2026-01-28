## Fragment 2.4 — Session & Auth State Management

**Goal:** The app always knows **who is logged in**, on both client and server.

---

### 2.4.1 Supabase Helpers

Create helpers under `lib/supabase/`:

```text
lib/supabase/
  client.ts
  server.ts
  middleware.ts
```

**Responsibilities:**

- `client.ts`
  - Browser auth client (`createBrowserClient`)
  - Used in client components and hooks

- `server.ts`
  - Server‑side client (`createServerClient`)
  - Used in Server Components, server actions, route handlers

- `middleware.ts`
  - Validates JWT on each request (for protected routes)
  - Hydrates auth info into request context if needed

**✅ Output**

- Single, consistent way to talk to Supabase from anywhere in the app

---

### 2.4.2 Auth Provider (Client)

Create a React provider:

```text
providers/AuthProvider.tsx
```

**Responsibilities:**

- Track current Supabase session on the client
- Fetch and cache `profile` + `role` for the logged‑in user
- Expose via context/hook:
  - `user`
  - `profile`
  - `role`
  - `loading` state (while checking session)

**✅ Output**

- Client components can safely check auth and role
- No need to manually call Supabase in every component