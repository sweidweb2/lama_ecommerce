# Guest Flow — Contact us submit

**Scope:** Guest (anon) Contact us form submit — public page → server action → honeypot / rate limit / validate → persist → admin can read.  
**Out of scope:** Admin contact CRUD polish, newsletter/leads (except shared rate-limit infra), guest “my messages”.

**Verdict:** Happy path **works**. Guest submit persists to `contact_us` via service role (public INSERT closed), with honeypot + IP rate limit. Admin can list/read via RLS. No contact emails. No P0 that blocks a normal short message from landing; remaining issues are validation UX, spam residual risk, and missing notifications.

---

## Happy path (what works today)

1. Open `/contact-us` (Navbar → Contact) — public client form.
2. Fill `full_name`, `email`, `phone`, `subject`, `message` (honeypot `website` left empty).
3. Submit → `createContactUsAction` → honeypot check → `checkFormRateLimit` (`contact:{ip}`, 5 / 15 min).
4. `createContactUs` → Zod (`createContactUsSchema`) → `createContactMessage` inserts with **service role** (`status` defaults to `new`).
5. Toast success; form clears.
6. Admin `/admin/contact` → `getAllContactUs` (`requireAdmin`) → session client + admin SELECT RLS → message visible.

```text
/contact-us (page.tsx)
  → createContactUsAction
       → honeypot website non-empty? → fake { success: true } (no insert)
       → checkFormRateLimit(contact:{ip})  [form_rate_limits via SR]
       → createContactUs (service)
            → createContactUsSchema.parse
            → createContactMessage (admin client → contact_us INSERT)
  → guest toast
  → /admin/contact → getAllContactUs → contact_us SELECT (admin RLS)
```

---

## P0 — Correctness (fix first)

_None verified._ Core submit → DB row → admin read path is wired and consistent with the post–2026-07-12 hardening (public INSERT dropped; app insert via service role).

---

## P1 — Incomplete / wrong submit behavior

- [x] ✅ **Validation failures throw instead of returning `{ success: false, error }`** done✅  
  Lead action uses `safeParse` and returns a clear error. Contact validates with `.parse()` inside the service; Zod/DB failures throw. Guest page only shows a generic toast in `catch` (and no field-level messages). Rate limit already ran, so a too-long name/message still burns a slot.  
  **Where:** `actions/contact_us.ts`; `services/contact_us.service.ts` (`createContactUs`); contrast `actions/lead.ts`.  
  **Do:** `safeParse` in the action (or service returning Result); map length/email errors to guest-facing strings; optionally rate-limit only after validation passes.  
  **Done:** `createContactUsAction` `safeParse`s before rate limit; returns `{ success: false, error, fieldErrors }`; insert failures caught as Result (no throw to guest).

- [x] ✅ **Tight Zod caps with no matching client limits / feedback** done✅  
  Wired schema: name ≤40, subject ≤100, message ≤400, phone ≤20. Form has HTML `required` only — no `maxLength`. Longer paste → opaque failure. Unused `lib/validators/user_contact/base.ts` allows name 200 / message 5000, suggesting the live caps may be unintentionally harsh.  
  **Where:** `lib/validators/contact_us/create.ts`; `app/(public)/contact-us/page.tsx`; orphan `lib/validators/user_contact/*`.  
  **Do:** Align limits with product intent; add `maxLength` + inline errors; delete or unify orphan validators.  
  **Done:** Caps aligned to storefront intent (name/subject 200, message 5000, phone 30) via `CONTACT_US_FIELD_MAX`; form `maxLength` + inline errors; orphan `user_contact` validators deleted.

---

## P2 — DX / stubs / spam residual / UX

- [x] **UI marks phone required; Zod treats phone as optional/nullable**  
  Browser may block empty phone; API path would accept null.  
  **Where:** `app/(public)/contact-us/page.tsx`; `lib/validators/contact_us/create.ts`.  
  **Do:** Match UI and schema (both required or both optional).  
  **Done:** UI phone is optional (`Phone (optional)`, no HTML `required`); Zod/DB already nullable.

- [x] **Rate limit fails open on `form_rate_limits` read/update errors**  
  Documented for availability; if the table/migration is missing, spam protection disappears while SR insert still works. Concurrent reads can also exceed the nominal limit (TOCTOU).  
  **Where:** `lib/rate-limit.ts`; `form_rate_limits` setup in `supabase/migrations/20260126141860_initial.sql`.  
  **Do:** Fail closed for public forms once the table is guaranteed, or use an atomic RPC/upsert.  
  **Done:** `check_form_rate_limit` RPC (`20260719150000`); TS fail-closed via repository.

- [ ] **No email to admin or guest on submit**  
  Order flow uses Resend (`lib/email/resend.ts`); contact path has zero notify/ack. Submit only lands in DB for `/admin/contact`.  
  **Where:** `services/contact_us.service.ts` / `actions/contact_us.ts` (no email calls).  
  **Do:** Optional Resend notify + guest ack if product needs it.

- [ ] **Sidebar contact details are placeholders**  
  Phone `+1 (234) 567-890`, `wa.me/1234567890` — not related to submit correctness but misleading on the same page.  
  **Where:** `app/(public)/contact-us/page.tsx`.  
  **Do:** Real business contacts or remove.

- [x] ✅ **No `generateMetadata` on `/contact-us`** done✅  
  SEO/title defaults to root layout only.  
  **Where:** `app/(public)/contact-us/page.tsx`.  
  **Do:** Route metadata.  
  **Done:** Server `page.tsx` exports `metadata` (`Contact Us`); form UI in `ContactUsPageClient`.

---

## Deferred (not guest-submit bugs)

- [ ] Captcha / Turnstile (honeypot + IP limit is the chosen hardening)
- [ ] Guest “my messages” / read-own-by-email (not shipped)
- [ ] Admin Create Contact dialog ignoring `{ success: false }` from the shared public action — admin-only
- [ ] Unifying orphan `user_contact` validators with `contact_us`

---

## DB tables in this flow

| Table | Role |
|-------|------|
| `contact_us` | Guest insert (service role); columns include `subject`, `message`, `full_name`, `phone`, `email`, `status` (`new`/`read`/`replied`/`resolved`, default `new`), `created_at` |
| `form_rate_limits` | Sliding-window counters (`key`, `window_started_at`, `hit_count`); RLS on, no anon policies → service role only |
| `profiles` | Admin SELECT/UPDATE/DELETE policies on `contact_us` check `role = 'admin'` |

**RLS:** Public contact INSERT **dropped**; admin read/update/delete remain. Guest clients cannot insert via anon key; app uses service role after action gates.

---

## Guest access notes

| Concern | Behavior |
|--------|----------|
| Route | `/contact-us` public |
| Auth | No login required |
| Write path | Server action only → SR insert (not anon PostgREST) |
| Spam | Honeypot `website` (fake success); IP rate limit 5 / 15 min; fail-open on RL DB errors |
| Read own messages | Not offered |
| Emails | None on contact submit |
| Admin landing | `/admin/contact`; gated by `requireAdmin` + admin RLS |

---

**Highest-impact fixes:** return structured validation errors like leads → surface/relax length limits → optional Resend notify for ops → harden rate-limit fail mode once `form_rate_limits` is guaranteed in deploy.
