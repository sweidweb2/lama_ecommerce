# Client Flow — Write Product Reviews

**Scope:** Logged-in customer `flow.md` bullet: write product reviews (PDP form → insert → public approved list).  
**Out of scope:** Admin moderation UI (Engagement Admin Flow); guest cannot write (sign-in CTA only).

**Verdict:** Happy path **works** — auth gate, insert as **`pending`** (matches RLS), toast says pending approval, public list shows approved; author also sees own pending on PDP. Revalidate uses concrete slug; comment required in Zod; self edit/delete is admin-only by design.

---

## Happy path (intended)

1. PDP → `ProductComments` with `isAuthenticated={!!user}`.
2. Guest → “Sign in to review” (`?redirect` to product).
3. Auth → rating + comment → `createReviewAction` → `createReviewService` (Zod) → `createReview` insert → revalidate → toast.
4. Public list: approved for everyone; authenticated also see own pending/rejected (RLS). Aggregates stay approved-only.
5. One review per `(product_id, user_id)` (unique + app check).

```text
PDP (auth)
  → createReviewAction → createReviewService
  → createReview INSERT review_status=pending (RLS OK)
  → getProductReviews (RLS: approved + own)
```

---

## Insert vs RLS (current)

| Layer | Value |
|-------|--------|
| DB default | `'pending'` |
| RLS user INSERT | `auth.uid() = user_id AND review_status = 'pending'` |
| Repo insert | **`review_status: "pending"`** |
| Toast | Pending approval |
| Public SELECT | Approved (+ own in some policies) |

**Result:** Customer submit succeeds; review waits in admin moderation queue until approved.

Users have **no UPDATE/DELETE** policies for own reviews — only admin `FOR ALL`.

---

## Capability checklist

| Capability | Status | Notes |
|------------|--------|--------|
| Guest write | No | Sign-in CTA |
| Auth write UI | Yes | Form shown when authenticated |
| Auth insert succeeds | **Yes** | Insert `pending` matches RLS |
| See approved reviews | Yes | List path |
| See own pending on PDP | Yes | Approved + own via RLS; badge in list |
| Edit/delete own review | No | Admin-only (documented) |

---

## P0 — Correctness (fix first)

- [x] ✅ **Insert `approved` vs RLS `pending` → customer submit broken** done✅  
  Repo hard-codes `review_status: "approved"`. User INSERT policy requires `pending`. Submit fails; moderation queue stays empty for real users.  
  **Where:** `repositories/review.repository.ts`; RLS in `supabase/migrations/20260126141860_initial.sql`; `lib/validators/product_review/create.ts` comment; `ProductComments.tsx` toast.  
  **Do:** Insert **`pending`**; align toast + comments; publish via admin approve.  
  **Also tracked:** `[04] Admin Flows/[06] Admin Flow - Engagement.md`.  
  **Done:** Insert uses `review_status: "pending"`; toast says pending approval; publish via admin approve.

---

## P1 — Incomplete / wrong review behavior

- [x] ✅ **Success toast claims pending while code intends approved** done✅  
  **Where:** `ProductComments.tsx`.  
  **Do:** Match chosen policy (moderation vs auto-publish) after P0 fix.  
  **Done:** Toast matches moderation policy (“submitted and is pending approval”).

- [x] ✅ **Own pending never shown on PDP even after insert fix** done✅  
  `getProductReviews` forces `approved` only.  
  **Where:** `repositories/review.repository.ts`; `ProductComments.tsx`.  
  **Do:** Include caller’s own non-approved, or “awaiting approval” UI.  
  **Done:** Repo relies on RLS (approved + own); list shows own pending/rejected with badges; form hidden after submit; `router.refresh()` after create.

---

## P2 — DX / polish

- [x] ✅ **`revalidatePath('/products/[slug]')` literal may not hit real slug** done✅  
  **Where:** `actions/review.ts`.  
  **Do:** Pass concrete `/products/${slug}`.  
  **Done:** Customer create passes `product_slug`; admin paths resolve slug via `getProductById` / delete `product_id` select.

- [x] ✅ **No user edit/delete of own review** done✅ (documented)  
  **Do:** Add policies/UI or document admin-only.  
  **Done:** Documented as admin-only — customers have no UPDATE/DELETE policies or PDP UI; moderation/edit/delete lives in admin Engagement.

- [x] ✅ **Comment required in service, optional in Zod** done✅  
  **Where:** `review.service.ts` vs create schema.  
  **Do:** Align schema + UI.  
  **Done:** `createReviewSchema` requires trimmed comment; service relies on Zod; UI unchanged. Admin base schema still allows optional comment.

---

## Deferred / works-as-implemented

| Behavior | Why OK / deferred |
|----------|-------------------|
| Auth-only write action | Guests rejected |
| Guest CTA + login redirect | Intended |
| Unique one review per user per product | App + DB |
| Admin approve/reject | Engagement admin |
| Approved-only public display | SELECT design (guests); auth also sees own |
| No customer edit/delete of own review | Admin-only; no user UPDATE/DELETE RLS or PDP UI |

---

## Edge-case matrix

| Case | Status |
|------|--------|
| Guest submit | Form hidden; sign-in CTA |
| Auth submit (current) | Works → pending moderation |
| Auth duplicate product | App check / `23505` |
| Auth empty comment | Zod + client toast |
| Auth rating 0 | Client toast |
| List approved reviews | Works |
| User sees own pending | Yes (badge + form replaced) |
| User update/delete own | No (admin-only) |
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

**Highest-impact remaining:** Account/Reviews customer P2 closed for this doc.
