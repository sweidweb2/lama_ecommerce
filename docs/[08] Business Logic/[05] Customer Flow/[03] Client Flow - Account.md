# Client Flow — Account

**Scope:** Logged-in customer Account from `flow.md`: profile display/edit, change password, manage addresses at `/account`.  
**Out of scope:** `/profile` hub and `/profile/setting` stubs (see `[04] Client Flow - Profile & Settings.md`); checkout address select/save detail (Client Buying); admin user CRUD.

**Verdict:** `/account` is the **live** surface (Navbar → Account). Password change and address CRUD **work** with known P1 hardening gaps. **Self profile edit is missing** (header is read-only; update actions are admin-only). Not “all green,” but day-to-day password + addresses are usable.

---

## Happy path (what works today)

1. Active user opens `/account` (middleware: auth + `is_active`; page also redirects if no user/profile).
2. `ProfileHeader` shows real `full_name`, email, role badge, member since — **read-only**.
3. **Change password** dialog → `ChangePasswordForm` (Zod ≥8 + confirm) → client `supabase.auth.updateUser({ password })` → toast.
4. **Addresses:** list from `getAddressesByUserId` → Add / Edit / Set default / Delete via `actions/address.ts` → Zod → repo; default clears others then sets; `revalidatePath("/account")`.
5. Checkout can prefill saved addresses and optionally save a new address after order (Buying doc).

```text
/account
  → middleware (auth + is_active)
  → getCurrentUserProfile + getAddressesByUserId
  → ProfileHeader (read-only)
  → ChangePasswordDialog → auth.client.updatePassword
  → AddressList → create|update|setDefault|deleteAddressAction
       → address.service → address.repository (session + RLS)
```

---

## Capability checklist

| Capability | Status | Notes |
|------------|--------|--------|
| View own profile | Yes | Real data on `/account` |
| Edit own profile (name, etc.) | **No** | No customer action/UI; admin-only update |
| Change password | Yes | No current-password re-auth |
| List / add / edit / delete addresses | Yes | Default-swap / delete-ack / list-sync P1s |
| Set default address | Yes | Clear-all-then-set race risk |
| Middleware gate | Yes | Auth + `is_active` |

---

## P0 — Correctness (fix first)

_None verified that block an active user from changing password or managing addresses on `/account`._

Misleading **John Doe** hub lives under `/profile` — tracked in `[04] Profile & Settings` (P0 there), not on `/account`.

---

## P1 — Incomplete / wrong account behavior

- [ ] **No self-service profile edit**  
  flow.md “Account: profile” implies edit; UI is display-only. `updateProfileAction` / admin service are admin-gated. Unused `lib/validators/user_profile/update.ts`.  
  **Where:** `app/(useraccount)/account/page.tsx`; `ProfileHeader.tsx`; `actions/profile.ts`.  
  **Do:** Own-profile action (e.g. `full_name` only) + form on `/account` (or settings when shipped).

- [ ] **RLS allows owner UPDATE of non-role columns (incl. `is_active`)**  
  Only `prevent_role_change` blocks self role change. Client could theoretically deactivate self.  
  **Where:** profiles UPDATE policy; initial migration.  
  **Do:** Restrict user updates to allowed columns via trigger/policy.

- [ ] **Change password without current password / re-auth**  
  Stolen session can set a new password.  
  **Where:** `ChangePasswordForm.tsx`; `repositories/auth.client.repository.ts`.  
  **Do:** Require current password (`signInWithPassword` then `updateUser`) or project AAL/reauth.

- [ ] **`setDefaultAddress` can leave zero defaults**  
  Clears all defaults, then sets target; bad/foreign `id` → clear succeeds, set fails → no default. Same clear-then-write pattern on create/update with `is_default`.  
  **Where:** `repositories/address.repository.ts`.  
  **Do:** Verify row ownership first; atomic RPC/transaction (set then clear others).

- [ ] **`deleteAddressById` can report success with 0 rows deleted**  
  **Where:** `deleteAddressById`; `deleteAddressAction`.  
  **Do:** Check affected row count; return not-found.

- [ ] **`AddressList` local state may stale after add/edit/set-default**  
  Initialized from props; delete is optimistic; other ops rely on revalidate/refresh.  
  **Where:** `components/account/AddressList.tsx`.  
  **Do:** Sync from props or update local state on every success.

---

## P2 — DX / polish

- [ ] **UI → repository for password** (skips action/service layer)  
  **Where:** `ChangePasswordForm.tsx` → `auth.client.repository.ts`.  
  **Do:** Thin action/service wrapper if team wants consistency.

- [ ] **`AddressForm` has `// @ts-nocheck`**  
  **Do:** Fix types; remove nocheck.

- [ ] **Loose phone/country validation**  
  **Where:** `lib/validators/user_address/base.ts`.  
  **Do:** Tighten if product requires.

- [ ] **No address / password feature tests**  
  **Do:** Add CRUD + default invariant + change-password schema tests.

- [ ] **Orphan `updateProfileSchema`** until self-edit ships  
  **Do:** Wire or delete.

---

## Deferred / works-as-implemented

| Behavior | Why OK |
|----------|--------|
| Hard-delete addresses | Project hard-delete posture |
| Checkout uses saved addresses / save after order | Client Buying |
| Admin profile CRUD at `/admin/users` | Customers admin doc |
| Forgot password | Guest Sign up (separate; still thin) |
| Inactive users blocked from `/account` | Middleware |

---

## Edge-case matrix

| Case | Status |
|------|--------|
| Authed active → `/account` | Real profile + addresses |
| Unauthed → `/account` | Login `?redirect=/account` |
| Inactive → `/account` | Login `reason=inactive` |
| Change password valid | Works |
| Password mismatch / short | Client Zod |
| Session expired mid password change | Supabase error toast |
| Add address with default | Others unset |
| Set default unknown id | Risk: all defaults cleared (P1) |
| Delete unknown id | Risk: success with 0 rows (P1) |
| Other user’s address id | RLS blocks |
| Edit own name | **No UI** (P1) |

---

## Key file map

| Concern | Path |
|---------|------|
| Page | `app/(useraccount)/account/page.tsx` |
| Header | `components/(public)/profile/ProfileHeader.tsx` |
| Password | `components/account/ChangePasswordDialog.tsx`, `ChangePasswordForm.tsx` |
| Password repo | `repositories/auth.client.repository.ts` (`updatePassword`) |
| Password schema | `lib/validators/auth/auth.ts` (`changePasswordSchema`) |
| Addresses UI | `components/account/AddressList.tsx`, `AddressForm.tsx` |
| Addresses stack | `actions/address.ts`, `services/address.service.ts`, `repositories/address.repository.ts` |
| Address validators | `lib/validators/user_address/*` |
| Profile (admin only mutate) | `actions/profile.ts`, `services/profile.service.ts` |
| Gate | `middleware.ts` (`/account`) |

---

## Related docs

- Index: `flow.md` (User → Account…)
- Profile hub stubs: `[04] Client Flow - Profile & Settings.md`
- Guest capabilities inheritance: `[02] Client Flow - Guest Capabilities.md`
- Checkout + save address: `[01] Client Flow - Buying.md`
- Inactive / login: Guest Sign up

**Highest-impact remaining:** self profile edit + RLS column lock → harden default/delete address → current-password on change → list state sync.
