## Phase 2 – Finishing Checklist

Use this as the final checklist before marking Phase 2 (Authentication & Authorization) as complete.

### Auth & Profiles
- [ ] Supabase email/password auth configured and tested
- [ ] Profile auto‑creation trigger on `auth.users` working
- [ ] `profiles.role` integrated with frontend `ROLES` constant

### RLS & Security
- [ ] RLS enabled on all relevant tables
- [ ] Catalog tables readable publicly as intended
- [ ] “Own data only” policies verified for:
  - [ ] `profiles`
  - [ ] `user_addresses`
  - [ ] `wishlists`
  - [ ] `carts` / `cart_items`
  - [ ] `orders` / `order_items`
  - [ ] `payments` / `shipments`
  - [ ] `contact_us` / `leads`

### Frontend Auth Flows
- [ ] Register, login, logout flows working end‑to‑end
- [ ] Password reset (request + reset page) tested
- [ ] Auth routes in `app/(storefront)/auth/*` wired up with Zod validation

### Session & State
- [ ] `lib/supabase/client.ts` and `server.ts` in use
- [ ] `AuthProvider` exposes `user`, `profile`, `role`, `loading`
- [ ] Client components rely on context/hooks instead of ad‑hoc Supabase calls

### Route Protection & Permissions
- [ ] `middleware.ts` correctly protects `(account)` and `(admin)` routes
- [ ] Permission helpers in `lib/auth/permissions.ts` used in UI and server actions

When all items are checked, Phase 2 is **done** and you can safely move on to Phase 3 (Storefront). 