# Admin Flow — Customers

**Scope:** Admin Customers from `flow.md`: users, leads, contact messages.  
**Out of scope:** Guest contact/lead submit polish (Guest Flow docs), ESP/newsletter send, hard-delete of `auth.users`, storefront account self-service.

**Verdict:** Day-to-day **list / create / update / delete (where shipped) works**. Guest lead unique + contact validation fixes **apply to admin lead create/update**. Main correctness gap: **`is_active` does not gate `/admin` or `requireAdmin`** (deactivated admin keeps the panel). Contact admin create still rides the **public** action (rate limit + no admin-only path).

---

## Happy path (what works today)

### Users (`/admin/users`)
1. Middleware: session + `role === admin` → page loads.
2. `getAdminUsersAction` → `getProfilesForAdmin` → `get_admin_profiles()` RPC (email via `auth.users`) or profiles-only fallback.
3. Table: search / role / status filters, client pagination.
4. **Create:** `createUserAction` (Zod) → service role `auth.admin.createUser` (`email_confirm: true`) + profile (`role`, `is_active`).
5. **Update:** `updateProfileAction` → session UPDATE `profiles` (`full_name`, `role`, `is_active`). Email read-only. Self role-change blocked by `prevent_role_change`.
6. **Delete:** not wired; soft-deactivate via `is_active` only.

### Leads (`/admin/leads`)
1. `getLeadsAction` → `requireAdmin` → `getAllLeads` (service role).
2. Search / paginate / CSV (client).
3. **Create / update:** Zod normalize email → SR insert/update; unique conflict → “already exists”.
4. **Delete:** SR delete.

### Contact messages (`/admin/contact`)
1. RSC → `getAllContactUs` → `requireAdmin` → session SELECT (admin RLS).
2. Filters / pagination / CSV / view / status / edit / delete.
3. **Create:** `CreateContactDialog` → **`createContactUsAction` (public)** → Zod → IP rate limit → SR insert → `router.refresh()`.
4. **Update / status / delete:** `requireAdmin` → session client + admin RLS.

```text
/admin/users
  → get_admin_profiles [session]
  → createUserAndProfile [service role]
  → updateProfileById [session + admin RLS]

/admin/leads
  → requireAdmin → lead.repository (SR; unique normalized email)

/admin/contact
  → get/update/delete [session + admin RLS]
  → create: createContactUsAction (public gates + SR insert)
```

---

## P0 — Correctness (fix first)

- [ ] **`is_active` does not block admin routes or admin actions**  
  UI copy: inactive users cannot access profile/account. Middleware enforces that on `/account` and `/profile` only. `/admin` checks **role**, not `is_active`. `requireAdmin` / `canAccessAdmin` ignore `is_active`. Deactivated admin keeps panel + RLS + actions until session ends. Login does not reject inactive.  
  **Where:** `middleware.ts` (`/admin`); `lib/auth/require-admin.ts`; `lib/auth/permissions.ts`; `components/admin/user/edit_form.tsx` (copy).  
  **Do:** Gate `/admin` + `requireAdmin` (and ideally login) on `profile.is_active === true`; optionally revoke sessions on deactivate.  
  **Also tracked:** Guest Flow — Sign up / Log in; Admin Dashboard P1.

---

## P1 — Incomplete / wrong customer-admin behavior

- [ ] **Admin Create Contact uses public action (rate limit + no admin gate)**  
  Shares honeypot/IP limit (`contact:{ip}`, 5/15m). Admin test creates can hit “Too many submissions”.  
  **Where:** `components/admin/contact/create_form.tsx`; `actions/contact_us.ts` `createContactUsAction`.  
  **Do:** Dedicated `createContactUsAdminAction` (`requireAdmin`, no rate limit, `revalidatePath`).

- [ ] **Lead update/delete succeed with no matching row**  
  SR update/delete without checking affected rows → success on missing id.  
  **Where:** `repositories/lead.repository.ts` `updateLead` / `deleteLead`.  
  **Do:** `.select()` / count rows; return not-found.

- [ ] **User edit does not refresh table UI**  
  Create calls `router.refresh()`; edit only closes dialog — stale client props possible.  
  **Where:** `components/admin/user/edit_form.tsx` vs create form.  
  **Do:** `router.refresh()` (or optimistic update) on successful edit.

- [ ] **Lists risk silent ~1000-row PostgREST cap**  
  Users / leads / contacts load unbounded selects/RPC without DB pagination.  
  **Where:** `profile.repository.ts`, `lead.repository.ts`, `contact.repository.ts`.  
  **Do:** Server pagination or ranged queries.

- [ ] **Leads RLS is SELECT-only; manage is SR-only**  
  Correct today (repo uses SR + `requireAdmin`); session-client manage would fail.  
  **Where:** leads policies; `repositories/lead.repository.ts`.  
  **Do:** Document as intentional, or add admin write policies if moving off SR.

---

## P2 — DX / UX / polish

- [ ] **Contact edit: Zod throws; weak field limits in UI**  
  Update uses `.parse()`; edit form lacks `maxLength` / field errors (create has caps).  
  **Where:** `services/contact_us.service.ts`; `components/admin/contact/edit_form.tsx`.  
  **Do:** `safeParse` + Result; mirror create limits.

- [ ] **Create Contact: subject not HTML-required**  
  Zod requires subject; UI may lack `*` / `required`.  
  **Where:** `components/admin/contact/create_form.tsx`.  
  **Do:** Align required + label with schema.

- [ ] **Orphan `DeleteUserDialog`** — soft-delete messaging; not mounted in `UsersTable`.  
  **Where:** `components/admin/user/delete_form.tsx`.  
  **Do:** Remove or wire as “Deactivate” shortcut.

- [ ] **Contact repo filters unused** — repo supports name/email/dates; page filters client-side.  
  **Where:** `repositories/contact.repository.ts`; contact table filters.

- [ ] **No admin password reset / email change / hard delete**  
  Create sets password once; email immutable; delete disabled.  
  **Do:** Product decision (Auth admin reset API) or keep deferred.

---

## Deferred (not bugs — planned later)

- [ ] Newsletter send / unsubscribe / double-opt-in — not Customers admin scope  
- [ ] Contact reply emails to guest — status workflow only today  
- [ ] User hard delete from Auth — intentionally soft-deactivate via `is_active`  
- [ ] Guest contact/lead submit details — `[02] Guest Flow` Contact / Newsletter docs  

---

## Works as implemented (not bugs)

| Behavior | Why OK |
|----------|--------|
| Lead unique + normalized email | Migration + admin duplicate errors |
| Contact create validation Result | Shared schema; admin create surfaces `result.error` |
| Rate limit fail-closed (RPC) | Guest + admin-via-public-create |
| Self role demotion blocked | `prevent_role_change` trigger |
| User hard delete disabled | Soft status only |
| Lead/contact CSV | Client export of filtered rows |
| Create inactive user | Supported; access gap is login/`is_active` gate (P0) |

---

## Edge-case matrix

| Scenario | Users | Leads | Contact |
|----------|-------|-------|---------|
| Non-admin hits route | Middleware → `/` | Same | Same |
| Non-admin calls action | Soft empty / fail | `requireAdmin` | Unauthorized |
| Inactive admin | **Still `/admin` + actions** (P0) | Same | Same |
| Inactive customer | Blocked `/account`/`/profile`; login allowed | n/a | n/a |
| Duplicate email create | Auth API error | Clear “already exists” | Allowed (many msgs) |
| Duplicate email update | n/a (email locked) | Clear “already exists” | n/a |
| Missing id update/delete | Fail / null | **Silent success** (P1) | UI error |
| Self role → user | Trigger blocks | n/a | n/a |
| Self → inactive | Allowed; **admin access remains** (P0) | n/a | n/a |
| RPC missing emails | Fallback, email `—` | n/a | n/a |
| Admin create rate limit | n/a | No RL on admin create | **Public RL applies** (P1) |
| &gt;1000 rows | Cap risk (P1) | Cap risk | Cap risk |
| Status replied/resolved | n/a | n/a | Edit can set; toggle may hide |

---

## Sub-area status

| Sub-area | List | Create | Update | Delete | Auth gates | Verdict |
|----------|------|--------|--------|--------|------------|---------|
| Users | Yes (RPC) | Yes (SR) | name / role / `is_active` | Soft only | Role; **not `is_active`** | Works with P0 inactive-admin hole |
| Leads | Yes (SR) | Yes + duplicate error | Yes + duplicate error | Yes | `requireAdmin` | Works; silent missing-id |
| Contact | Yes (session) | Via **public** action | Fields + status | Yes | Update/delete gated; create public | Works for ops; need admin create |

---

## Key file map

| Layer | Users | Leads | Contact |
|-------|-------|-------|---------|
| Page | `app/admin/users/page.tsx` | `app/admin/leads/page.tsx` | `app/admin/contact/page.tsx` |
| Actions | `actions/profile.ts` | `actions/lead.ts` | `actions/contact_us.ts` |
| Services | `profile.service.ts` | `lead.service.ts` | `contact_us.service.ts` |
| Repos | `profile.repository.ts` | `lead.repository.ts` | `contact.repository.ts` |
| Validators | `lib/validators/user_profile/*` | `lib/validators/lead/*` | `lib/validators/contact_us/create.ts` |
| UI | `components/admin/user/*` | `components/admin/lead/*` | `components/admin/contact/*` |
| Auth | `middleware.ts`, `require-admin.ts` | same | same |
| Client | Create SR; list/update session | All admin CRUD SR | Create SR; R/U/D session |
| Migrations | profiles RLS + `get_admin_profiles` | `20260719151000_leads_unique_normalized_email.sql` | contact RLS; public INSERT dropped |
| Tests | — | `lead-admin-duplicate.test.ts` | `contact-qa-admin-auth.test.ts` |

---

## DB tables in this flow

| Table | Role |
|-------|------|
| `profiles` (+ `auth.users`) | Admin user list/create/update; `role` / `is_active` |
| `leads` | Newsletter list CRUD; unique normalized email |
| `contact_us` | Messages CRUD + status |
| `form_rate_limits` / RPC | Shared by public contact create (admin create too today) |

---

## Related docs

- Index: `docs/[08] Business Logic/flow.md` (Admin → Customers)
- Guest contact / leads: `[02] Guest Flow/[03] Guest Flow - Contact us.md`, `[04] Guest Flow - Newsletter Lead Signup.md`
- Auth `is_active` gap: `[02] Guest Flow/[05] Guest Flow - Sign up Log in.md`
- Storefront as admin: `[04] Admin Flows/[01] Admin Flow - Storefront User Capabilities.md`

**Highest-impact fixes:** enforce `is_active` on `/admin` + `requireAdmin` → admin-only contact create (skip rate limit) → lead update/delete not-found → user edit `router.refresh()` → server pagination when lists grow.
