## Phase 2 — Parallel Work by Fragment Numbers

### Owner 1: You (Backend / Security)

**Fragments:**

- **2.1 – Auth Foundations**
  - Supabase Auth configuration (dashboard)
  - Profile auto‑create trigger on `auth.users` → `profiles`
  - Role enum in DB + TS constants

- **2.2 – RLS Policies**
  - Profiles RLS (user / admin / optional super_admin)
  - Global auth assumptions (`auth.uid()`, roles from `profiles.role`)

---

### Owner 2: Friend 1 (Frontend Auth UI)

**Fragments:**

- **2.3 – Frontend Auth Flows**
  - Register page
  - Login page
  - Password reset flow
  - Logout action

Each page should:
- Use Zod validation
- Call Supabase auth methods
- Handle success / error states

---

### Owner 3: Friend 2 (Routing & Permissions)

**Fragments:**

- **2.4 – Session & Auth State**
  - Auth provider (React context)
  - Supabase helpers (`lib/supabase/client.ts`, `server.ts`, `middleware.ts`)

- **2.5 – Route Protection**
  - `middleware.ts` routing rules
  - Permission utilities (`lib/auth/permissions.ts`)

---

### Dependency Notes

- **2.1 → 2.2** must be completed before building serious **admin** features (they depend on roles + RLS).
- **2.3** (frontend auth pages) can start **immediately** once basic Supabase Auth is configured.
- **2.4 / 2.5** can initially use a **mocked role** until real roles + RLS from 2.2 are in place.