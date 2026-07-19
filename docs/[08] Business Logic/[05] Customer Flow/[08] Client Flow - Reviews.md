# Client Flow — Write Product Reviews

**Scope:** Logged-in customer `flow.md` bullet: write product reviews (PDP form → insert → public approved list).  
**Out of scope:** Admin moderation UI (Engagement Admin Flow); guest cannot write (sign-in CTA only).

**Verdict:** **Broken (P0).** Auth gate and UI exist, but repo inserts `review_status: "approved"` while RLS requires `pending` for user INSERT — submit fails for normal customers. Toast may imply pending approval. Public list correctly shows approved-only. Fix insert to `pending` (or change RLS if auto-publish is intentional).

---

## Happy path (intended)

1. PDP → `ProductComments` with `isAuthenticated={!!user}`.
2. Guest → “Sign in to review” (`?redirect` to product).
3. Auth → rating + comment → `createReviewAction` → `createReviewService` (Zod) → `createReview` insert → revalidate → toast.
4. Public list: `getProductReviews` / UI filter `review_status === 'approved'`.
5. One review per `(product_id, user_id)` (unique + app check).

```text
PDP (auth)
  → createReviewAction → createReviewService
  → createReview INSERT review_status=??? 
       ✗ code: approved  |  RLS: pending only
  → getProductReviews (approved only)
```

---

## Insert vs RLS (current)

| Layer | Value |
|-------|--------|
| DB default | `'pending'` |
| RLS user INSERT | `auth.uid() = user_id AND review_status = 'pending'` |
| Repo insert | **`review_status: "approved"`** |
| Toast | Implies pending approval |
| Public SELECT | Approved (+ own in some policies) |

**Result:** Non-admin insert fails RLS. Success toast never reached for normal users. Admin Engagement P0 matches this.

Users have **no UPDATE/DELETE** policies for own reviews — only admin `FOR ALL`.

---

## Capability checklist

| Capability | Status | Notes |
|------------|--------|--------|
| Guest write | No | Sign-in CTA |
| Auth write UI | Yes | Form shown when authenticated |
| Auth insert succeeds | **No** | RLS vs `approved` (P0) |
| See approved reviews | Yes | List path |
| See own pending on PDP | No | Filter + insert never succeeds |
| Edit/delete own review | No | No policy / no UI |

---

## P0 — Correctness (fix first)

- [ ] **Insert `approved` vs RLS `pending` → customer submit broken**  
  Repo hard-codes `review_status: "approved"`. User INSERT policy requires `pending`. Submit fails; moderation queue stays empty for real users.  
  **Where:** `repositories/review.repository.ts` (~71); RLS in `supabase/migrations/20260126141860_initial.sql`; `lib/validators/product_review/create.ts` comment; `ProductComments.tsx` toast.  
  **Do:** Insert **`pending`**; align toast + comments; publish via admin approve.  
  **Also tracked:** `[04] Admin Flows/[06] Admin Flow - Engagement.md`.

---

## P1 — Incomplete / wrong review behavior

- [ ] **Success toast claims pending while code intends approved**  
  **Where:** `ProductComments.tsx`.  
  **Do:** Match chosen policy (moderation vs auto-publish) after P0 fix.

- [ ] **Own pending never shown on PDP even after insert fix**  
  `getProductReviews` forces `approved` only.  
  **Where:** `repositories/review.repository.ts`.  
  **Do:** Include caller’s own non-approved, or “awaiting approval” UI.

---

## P2 — DX / polish

- [ ] **`revalidatePath('/products/[slug]')` literal may not hit real slug**  
  **Where:** `actions/review.ts`.  
  **Do:** Pass concrete `/products/${slug}`.

- [ ] **No user edit/delete of own review**  
  **Do:** Add policies/UI or document admin-only.

- [ ] **Comment required in service, optional in Zod**  
  **Where:** `review.service.ts` vs create schema.  
  **Do:** Align schema + UI.

---

## Deferred / works-as-implemented

| Behavior | Why OK / deferred |
|----------|-------------------|
| Auth-only write action | Guests rejected |
| Guest CTA + login redirect | Intended |
| Unique one review per user per product | App + DB |
| Admin approve/reject | Engagement admin |
| Approved-only public display | SELECT design |

---

## Edge-case matrix

| Case | Status |
|------|--------|
| Guest submit | Form hidden; sign-in CTA |
| Auth submit (current) | **Fails RLS** (P0) |
| Auth duplicate product | App check / `23505` |
| Auth empty comment | Service error |
| Auth rating 0 | Client toast |
| List approved reviews | Works |
| User sees own pending | No |
| User update/delete own | No |
| Admin approve/reject | Works (Engagement) |

---

## Key file map

| Concern | Path |
|---------|------|
| UI | `ProductComments.tsx`, `ProductReviews.tsx`, `products/[slug]/page.tsx` |
| Action / service / repo | `actions/review.ts`, `services/review.service.ts`, `repositories/review.repository.ts` |
| Validators | `lib/validators/product_review/*` |
| RLS | `supabase/migrations/20260126141860_initial.sql` |
| Admin moderation | Admin Engagement doc |

---

## Related docs

- Index: `flow.md` (User → Write product reviews)
- Admin moderation: `[04] Admin Flows/[06] Admin Flow - Engagement.md`
- Auth for PDP: Guest Capabilities / Sign up

**Highest-impact fix:** insert `pending` to match RLS → then toast + optional “your review awaiting approval” on PDP.
