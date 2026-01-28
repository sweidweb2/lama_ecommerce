## Fragment 2.6 — Final Hardening & Validation

**Goal:** Close remaining security gaps before shipping Phase 2.

---

### 2.6.1 Security Checklist

Verify that:

- **Middleware** validates session for all protected routes
  - Auth routes behave correctly for logged‑in vs logged‑out users
- **RLS** is enabled on all tables and **denies by default**
  - Only explicit policies allow data access
- **Roles are never trusted from the client**
  - All role checks read from `profiles.role` (DB)
- **TypeScript types** avoid exposing sensitive fields
  - No raw tokens, secrets, or internal‑only columns in shared types

**✅ Output**

- Auth + RLS behave as expected under manual testing
- Safe baseline to start building higher‑level features (account, admin)