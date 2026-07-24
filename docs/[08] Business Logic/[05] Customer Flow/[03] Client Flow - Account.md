# Client Flow — Account



**Scope:** Logged-in customer Account from `flow.md`: profile display/edit, change password, manage addresses at `/account`.  

**Out of scope:** `/profile` hub and `/profile/setting` stubs (see `[04] Client Flow - Profile & Settings.md`); checkout address select/save detail (Client Buying); admin user CRUD.



**Verdict:** `/account` is the **live** surface (Navbar → Account). Profile name edit, password change, and address CRUD **work** with known P1 hardening gaps (password re-auth, address default race). Not “all green,” but day-to-day account management is usable.



---



## Happy path (what works today)



1. Active user opens `/account` (middleware: auth + `is_active`; page also redirects if no user/profile).

2. `ProfileHeader` shows real `full_name`, email, role badge, member since — **display-only**.

3. **Edit profile** dialog → `EditProfileForm` (`full_name` Zod) → `updateOwnProfileAction` → service/repo → toast + refresh.

4. **Change password** dialog → `ChangePasswordForm` (Zod ≥8 + confirm) → client `supabase.auth.updateUser({ password })` → toast.

5. **Addresses:** list from `getAddressesByUserId` → Add / Edit / Set default / Delete via `actions/address.ts` → Zod → repo; default clears others then sets; `revalidatePath("/account")`.

6. Checkout can prefill saved addresses and optionally save a new address after order (Buying doc).



```text

/account

  → middleware (auth + is_active)

  → getCurrentUserProfile + getAddressesByUserId

  → ProfileHeader (display)

  → EditProfileDialog → updateOwnProfileAction → updateOwnProfile

  → ChangePasswordDialog → auth.client.updatePassword

  → AddressList → create|update|setDefault|deleteAddressAction

       → address.service → address.repository (session + RLS)

```



---



## Capability checklist



| Capability | Status | Notes |

|------------|--------|--------|

| View own profile | Yes | Real data on `/account` |

| Edit own profile (name) | Yes | `full_name` only via Edit profile dialog |

| Change password | Yes | Requires current password (re-auth) |

| List / add / edit / delete addresses | Yes | CRUD + default via atomic RPC |

| Set default address | Yes | `set_default_user_address` RPC |

| Middleware gate | Yes | Auth + `is_active` |



---



## P0 — Correctness (fix first)



_None verified that block an active user from changing password or managing addresses on `/account`._



Misleading **John Doe** hub under `/profile` — **resolved:** `/profile` and `/profile/setting` redirect to `/account`; admin header → `/account` (see `[04]`).



---



## P1 — Incomplete / wrong account behavior



- [x] ✅ **No self-service profile edit** done✅  

  **Where:** `app/(useraccount)/account/page.tsx`; `EditProfileDialog.tsx`; `actions/profile.ts`.  

  **Done:** `updateOwnProfileAction` + `updateOwnProfile` (`full_name` only) + Edit profile dialog on `/account`.



- [x] ✅ **RLS allows owner UPDATE of non-role columns (incl. `is_active`)** done✅  

  **Where:** `prevent_role_change` / `20260724120000_profiles_restrict_owner_updates.sql`.  

  **Done:** Owner updates blocked for `role`, `is_active`, `user_id`, `id`, `created_at`; only `full_name` allowed. Admins updating other users unaffected.



- [x] ✅ **Change password without current password / re-auth** done✅  

  Stolen session can set a new password.  

  **Where:** `ChangePasswordForm.tsx`; `repositories/auth.client.repository.ts`.  

  **Do:** Require current password (`signInWithPassword` then `updateUser`) or project AAL/reauth.  

  **Done:** `accountChangePasswordSchema` + current-password field; `changePasswordService` re-auths via `signInWithPassword` then `updateUser`. Reset flow unchanged.



- [x] ✅ **`setDefaultAddress` can leave zero defaults** done✅  

  Clears all defaults, then sets target; bad/foreign `id` → clear succeeds, set fails → no default. Same clear-then-write pattern on create/update with `is_default`.  

  **Where:** `repositories/address.repository.ts`.  

  **Do:** Verify row ownership first; atomic RPC/transaction (set then clear others).  

  **Done:** `set_default_user_address` RPC (set then clear others); create/update with `is_default` write first then call RPC (no pre-clear).



- [x] ✅ **`deleteAddressById` can report success with 0 rows deleted** done✅  

  **Where:** `deleteAddressById`; `deleteAddressAction`.  

  **Do:** Check affected row count; return not-found.  

  **Done:** Delete uses `.select("id")`; returns false when 0 rows affected.



- [x] ✅ **`AddressList` local state may stale after add/edit/set-default** done✅  

  Initialized from props; delete is optimistic; other ops rely on revalidate/refresh.  

  **Where:** `components/account/AddressList.tsx`.  

  **Do:** Sync from props or update local state on every success.  

  **Done:** `useEffect` syncs local state from `initialAddresses` after refresh.



---



## P2 — DX / polish



- [x] ✅ **UI → repository for password** (skips action/service layer) done✅  

  **Where:** `ChangePasswordForm.tsx` → `auth.client.repository.ts`.  

  **Do:** Thin action/service wrapper if team wants consistency.  

  **Done:** Account change uses `changePasswordService` (re-auth + update); reset confirm uses `confirmPasswordResetService`. Both wrap `auth.client.repository.updatePassword`.



- [x] ✅ **`AddressForm` has `// @ts-nocheck`** done✅  

  **Do:** Fix types; remove nocheck.  

  **Done:** Nocheck removed; form typed via `z.input` / `z.output` of `addressBaseSchema`.



- [x] ✅ **Loose phone/country validation** done✅  

  **Where:** `lib/validators/user_address/base.ts`.  

  **Do:** Tighten if product requires.  

  **Done:** Address-book phone uses shared `phoneSchema` (8–15 digits, same as checkout); country/city/address trimmed. Country remains free text.



- [x] ✅ **No address / password feature tests** done✅  

  **Do:** Add CRUD + default invariant + change-password schema tests.  

  **Done:** Unit schema tests for change-password + address base; feature tests for password services and address service CRUD + setDefault wiring.



- [x] ✅ **Orphan `updateProfileSchema`** done✅  

  **Done:** Wired to `updateOwnProfileAction` / `EditProfileForm` (`full_name` only).



---



## Deferred / works-as-implemented



| Behavior | Why OK |

|----------|--------|

| Hard-delete addresses | Project hard-delete posture |

| Checkout uses saved addresses / save after order | Client Buying |

| Admin profile CRUD at `/admin/users` | Customers admin doc |

| Forgot password | Guest Sign up (separate; still thin) |

| Inactive users blocked from `/account` | Middleware |

| Owner cannot change own `role` / `is_active` | Trigger column lock |



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

| Set default unknown id | Handled (RPC not-found; no pre-clear) |

| Delete unknown id | Handled (not-found) |

| Other user’s address id | RLS blocks |

| Edit own name | Works (`full_name` dialog) |

| Owner UPDATE `is_active` / `role` | Trigger rejects |



---



## Key file map



| Concern | Path |

|---------|------|

| Page | `app/(useraccount)/account/page.tsx` |

| Header | `components/(public)/profile/ProfileHeader.tsx` |

| Edit profile | `components/account/EditProfileDialog.tsx`, `EditProfileForm.tsx` |

| Own-profile action/service | `actions/profile.ts` (`updateOwnProfileAction`), `services/profile.service.ts` (`updateOwnProfile`) |

| Own-profile schema | `lib/validators/user_profile/update.ts` (`updateProfileSchema`) |

| Owner column lock | `supabase/migrations/20260724120000_profiles_restrict_owner_updates.sql` |

| Password | `components/account/ChangePasswordDialog.tsx`, `ChangePasswordForm.tsx` |

| Password repo | `repositories/auth.client.repository.ts` (`updatePassword`) |

| Password schema | `lib/validators/auth/auth.ts` (`accountChangePasswordSchema`, `changePasswordSchema`) |
| Password service | `services/auth.service.ts` (`changePasswordService`, `confirmPasswordResetService`) |
| Set-default RPC | `supabase/migrations/20260724190000_set_default_user_address.sql` |

| Addresses UI | `components/account/AddressList.tsx`, `AddressForm.tsx` |

| Addresses stack | `actions/address.ts`, `services/address.service.ts`, `repositories/address.repository.ts` |

| Address validators | `lib/validators/user_address/*` |

| Profile (admin mutate) | `actions/profile.ts` (`updateProfileAction`), `services/profile.service.ts` (`updateProfileAdmin`) |

| Gate | `middleware.ts` (`/account`) |



---



## Related docs



- Index: `flow.md` (User → Account…)

- Profile hub stubs: `[04] Client Flow - Profile & Settings.md`

- Guest capabilities inheritance: `[02] Client Flow - Guest Capabilities.md`

- Checkout + save address: `[01] Client Flow - Buying.md`

- Inactive / login: Guest Sign up



**Highest-impact remaining:** Account P1 closed. Profile hub consolidated to `/account` (see `[04]`).


