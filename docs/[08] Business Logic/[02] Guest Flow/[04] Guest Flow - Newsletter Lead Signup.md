# Guest Flow — Newsletter / Lead Signup

**Scope:** Guest (or any storefront visitor) submits email via footer “Stay updated” → stored in `leads` → admin list / CSV.  
**Out of scope:** Actual newsletter campaigns / ESP send (deferred). Contact-us is a separate guest flow.

**Verdict:** Capture path works end-to-end (honeypot + rate limit + service-role insert + admin CRUD/export). Not “fully finished product” — duplicates, no unsubscribe, no send pipeline. Use the checklists below to fix or consciously defer.

---

## Happy path (what works today)

1. Open any public page → scroll to footer **Stay updated**.
2. Enter email → Submit (`Footer` → `createLeadAction`).
3. Honeypot empty → IP rate limit (`lead:{ip}`, 10/hour) → Zod email → `createLeadService` → `createLead` (service role insert into `leads`).
4. Toast: “Thanks! We'll keep you updated.” Form clears.
5. Admin opens `/admin/leads` → list / search / paginate / CSV export / create / edit / delete (`requireAdmin` on actions + services).

```text
Footer (Stay updated)
  → createLeadAction (honeypot → rate limit → createLeadSchema)
  → createLeadService → createLead (admin/service-role client)
  → leads row (email, created_at)
  → toast success

Admin /admin/leads
  → getLeadsAction / create|update|deleteLead*Action
  → requireAdmin → lead.service → lead.repository (SR)
  → optional CSV download (client-side)
```

---

## P0 — Correctness (fix first)

- [ ] **Duplicate emails always insert another row**  
  `leads.email` is `NOT NULL` only — **no UNIQUE**. Re-submit (or case variants) creates more rows; guest still gets success. Admin list fills with dupes; CSV exports them.  
  **Where:** `supabase/migrations/20260126141860_initial.sql` (`leads`); `repositories/lead.repository.ts` `createLead` / `createLeadAdmin`.  
  **Do:** Unique index on normalized email (e.g. `lower(trim(email))`); on conflict treat as success (“already subscribed”) without insert, or update `created_at` / last-seen. Surface friendly copy in footer toast.

- [ ] **Email not normalized (trim / lowercase) before write**  
  Public action passes form email straight to Zod; admin UI trims only. `Foo@X.com` vs `foo@x.com` are different leads even after a unique constraint unless normalized. Trailing spaces can fail validation inconsistently vs admin.  
  **Where:** `actions/lead.ts` `createLeadAction`; `createLeadSchema`; admin create/edit forms.  
  **Do:** `.transform((e) => e.trim().toLowerCase())` in create/update schemas (or normalize in service before repo).

---

## P1 — Incomplete / wrong lead behavior

- [ ] **“Newsletter” is lead list only — nothing is sent**  
  Signup stores email; no Resend/campaign job, no welcome mail, no promo blast. Marketing copy promises “news and offers.”  
  **Where:** `components/common/Footer.tsx`; `lib/email/*` (order confirmation only).  
  **Do:** Integrate ESP (or Resend audiences) + send path, or soften footer copy to “join our list” until send exists.

- [ ] **No unsubscribe / consent record**  
  Privacy page mentions withdraw consent / marketing consent; `leads` has only `id, email, created_at`. No status, source, double-opt-in, or unsubscribe token. GDPR/marketing hygiene gap.  
  **Where:** `leads` schema; footer form; `app/(public)/privacy_policy/page.tsx`.  
  **Do:** Add `status` / `unsubscribed_at` / `source`; public unsubscribe link; optional double-opt-in before marking active.

- [ ] **Re-subscribe UX lies about “already on list”**  
  Even if insert fails later (or after unique is added), action maps any repo `false` to generic “Something went wrong.” No idempotent success for known emails.  
  **Where:** `actions/lead.ts`; `createLead` boolean return.  
  **Do:** Return distinct outcomes: `created` | `already_subscribed` | `error`; toast accordingly.

- [ ] **Admin RLS is SELECT-only; “manage” is service-role only**  
  Policies: public INSERT dropped; `Admins can read leads` SELECT only. Update/delete rely entirely on admin client + `requireAdmin`. Session-client admin manage would fail. Docs say read/manage — accurate only via SR path.  
  **Where:** initial leads RLS + `20260712110001_contact_leads_rate_limit.sql`; `repositories/lead.repository.ts`.  
  **Do:** Keep SR + `requireAdmin` (document), or add admin UPDATE/DELETE policies if session client is ever used.

---

## P2 — DX / stubs / edge cases

- [ ] **Rate limit fails open**  
  If `form_rate_limits` read/write errors, `checkFormRateLimit` returns `true` (allow). Outage → spam possible again.  
  **Where:** `lib/rate-limit.ts`.  
  **Do:** Fail closed for leads (or fail closed only when table exists / env production).

- [ ] **Rate limit not atomic / shared `unknown` IP**  
  Read-then-update race can exceed 10/hour under concurrency. Missing `x-forwarded-for` / `x-real-ip` → key `lead:unknown` shared by all such clients.  
  **Where:** `lib/rate-limit.ts` `getClientIpFromHeaders`.  
  **Do:** Atomic RPC increment; document proxy headers; optional fallback key (session id) if IP missing.

- [ ] **Stale UI docs: `NewsletterSection` does not exist**  
  `docs/[06] UI/ui.md` references `newsletter-section.tsx` / home section; only footer signup ships.  
  **Where:** `docs/[06] UI/ui.md`; no `components/**/newsletter*`.  
  **Do:** Remove stale imports from docs, or add a home section wired to the same `createLeadAction`.

- [ ] **Signup surface is footer-only**  
  No dedicated modal, checkout CTA, or home block (beyond docs stub). Easy to miss on mobile.  
  **Where:** `components/common/Footer.tsx` only.  
  **Do:** Optional second entry (home / cart success) sharing the same action.

- [ ] **Leads not linked to accounts**  
  Logged-in user can subscribe; no `user_id` on `leads`. Duplicate of profile email with no merge.  
  **Where:** `leads` schema; `createLeadAction`.  
  **Do:** Optional `user_id` when session present; skip or link on signup.

- [ ] **Admin list is client-fetch all + slice**  
  `getAllLeads` loads full table; page filters/paginates in memory (cap 100 pages × 20). Fine at small N; degrades as list grows.  
  **Where:** `app/admin/leads/page.tsx`; `getAllLeads`.  
  **Do:** Server-side search/pagination when volume matters.

- [ ] **`(supabase as any)` on lead repo**  
  Typed client bypassed; typos won’t fail compile.  
  **Where:** `repositories/lead.repository.ts`.  
  **Do:** Use generated `Database` types for `.from("leads")`.

---

## Deferred (not bugs — planned later)

- [ ] ESP / Resend campaign send + templates  
- [ ] Double opt-in confirmation email  
- [ ] Preference center / topic tags (offers vs product drops)  
- [ ] Auto-sync lead → CRM

---

## DB tables in this flow

| Table | Role |
|-------|------|
| `leads` | Newsletter / lead emails (`id`, `email`, `created_at`) |
| `form_rate_limits` | Sliding-window IP limits for `lead:{ip}` |
| `profiles` | Admin gate via `requireAdmin` / RLS admin SELECT on leads |

---

## Guest vs admin

| | Guest / public | Admin |
|--|----------------|-------|
| Entry | Footer form (all non-`/admin` layouts) | `/admin/leads` |
| Insert | Server action → service role (public INSERT policy **removed**) | Same table via admin create dialog |
| Authz | Honeypot + rate limit + Zod only | `requireAdmin` on action + service |
| Read | None (RLS) | Admin SELECT policy and/or SR list |
| Update / delete | — | SR + `requireAdmin` |
| Export | — | Client CSV from loaded rows |

Guests (and logged-in customers on storefront) can submit without signing in. Collection works; sending and marketing compliance tooling do not.

---

**Highest-impact fixes:** unique + normalize email → idempotent “already subscribed” → unsubscribe/status (or honest copy) → fail-closed rate limit in production → wire or delete stale `NewsletterSection` docs.
