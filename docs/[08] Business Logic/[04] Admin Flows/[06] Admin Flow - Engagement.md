# Admin Flow — Engagement

**Scope:** Admin Engagement from `flow.md`: reviews moderation, Q&A manage/answer; storefront Q&A ask/read on PDP.  
**Out of scope:** Dashboard preview quirks (Dashboard doc).

**Verdict:** Admin **list / create / edit-status / delete** for reviews and **list / create / answer / approve / delete** for Q&A work. Storefront review submit inserts **`pending`**. Storefront Q&A: customers ask (pending); admin answer auto-approves + records `admin_id`; PDP shows approved Q&A. RLS policies allow public read of approved Q&A and auth insert of own pending questions.

---

## Happy path (what works today)

### Reviews
1. `/admin/reviews` → `listReviewsForAdminService` + `getAdminReviewStatsService` (`requireAdmin`) → session client + admin RLS; products/profiles for Create.
2. Stat cards from exact head counts; URL filters (status, rating, product `q`) + server pagination.
3. Create → `createReviewAdminAction` → real product/user + any status → DB write.
4. Edit → `updateReviewAction` → status `pending|approved|rejected`, rating/title/comment → revalidate admin + product paths.
5. One-click Approve / Reject on the row → `updateReviewAction({ review_status })`.
6. Delete → hard delete + revalidate.
7. Storefront PDP: submit → `pending`; `getProductReviews` shows `approved` only (RLS aligned for SELECT).

### Q&A
1. `/admin/qa` → `getAllQuestionsAdmin` + products/profiles → `QATable`.
2. Create (real products/profiles) → SR insert; optional answer forces `is_approved` + `admin_id`.
3. View → answer (`submitAnswerAction`) → inserts answer with `admin_id`, sets `is_approved = true`.
4. Edit → question / answer (diff-before-insert) / approval; Delete → cascade answers.
5. Storefront PDP `ProductQA`: list approved Q&A; customers ask via `createProductQuestionAction` (pending); guests sign-in CTA; admins redirected to panel.

```text
/admin/qa
  → answer → addProductAnswer(admin_id) + is_approved=true

Storefront PDP
  → getProductQuestionsService (approved + latest answer)
  → createProductQuestionAction (auth customer, is_approved=false)
```

---

## P0 — Correctness (fix first)

- [x] ✅ **User review insert sets `approved`; RLS requires `pending`** done✅  
  **Done:** User create inserts `pending`; publish via admin approve/reject.

- [x] ✅ **Admin “Create Review” is a stub** done✅  
  **Done:** Page loads products/profiles; `createReviewAdminAction` → real DB insert.

---

## P1 — Incomplete / wrong engagement behavior

- [x] ✅ **Auth/load failures look like an empty inbox** done✅  
- [x] ✅ **No one-click approve/reject** done✅  
- [x] ✅ **Review list/stats subject to ~1000-row PostgREST cap** done✅  
- [x] ✅ **Q&A edit can insert duplicate answers** done✅  

- [x] ✅ **Answering does not set `is_approved`** done✅  
  **Done:** `submitAnswerAdmin` / answer-on-update / create-with-answer set `is_approved = true`.

- [x] ✅ **No storefront Q&A surface** done✅  
  **Done:** `ProductQA` on PDP; RLS migration `20260720193000_product_qa_public_rls.sql`; public create action.

- [x] ✅ **`admin_id` never recorded on answers** done✅  
  **Done:** Actions pass `requireAdmin().user_id` into create/update/submit answer paths.

- [x] ✅ **`is_active` ignored for `/admin`** done✅ — middleware + `requireAdmin`.

---

## P2 — DX / UX

- [x] ✅ **Reviews: unused `avgRating` / imports not shown in UI** done✅  
- [x] ✅ **Q&A: approved-without-answer labeled “Pending”; filters name-only** done✅  
- [x] ✅ **Review actions: login check only; real gate in service (OK but inconsistent with Q&A)** done✅  

---

## Deferred / works-as-implemented

| Behavior | Why OK / deferred |
|----------|-------------------|
| Storefront shows approved reviews only (SELECT) | Repo + UI + RLS |
| Storefront shows approved Q&A only | Repo + UI + RLS |
| Admin Q&A still uses service role for panel CRUD | Bypasses RLS for ops |
| Hard delete reviews / questions | Cascade answers |
| Soft-delete / author self-edit | Out of scope |
| Feature tests | `contact-qa-admin-auth.test.ts`, `product-qa-public.test.ts` |

---

## Edge-case matrix

| Edge case | Status |
|-----------|--------|
| Admin answers question | Approves + records `admin_id` |
| Customer asks on PDP | Pending until answered |
| Guest opens Q&A form | Sign-in CTA |
| Admin on PDP ask form | Link to `/admin/qa` |
| Approved Q&A on PDP | Listed with latest answer |

---

## Sub-area status

| Sub-area | List | Create | Moderate / answer | Delete | Notes |
|----------|------|--------|-------------------|--------|-------|
| Reviews (admin) | OK | OK | Edit + row actions | OK | Create wired |
| Reviews (storefront write) | — | OK (`pending`) | — | — | Publish via admin |
| Q&A (admin) | OK | OK | OK (auto-approve + admin_id) | OK | SR panel |
| Q&A (storefront) | OK (approved) | OK (pending ask) | — | — | PDP `ProductQA` |

---

## Key file map

| Concern | Path |
|---------|------|
| Pages | `app/admin/reviews/page.tsx`, `app/admin/qa/page.tsx`, `app/(public)/products/[slug]/page.tsx` |
| Actions | `actions/review.ts`, `actions/product_question.ts` |
| Services | `services/review.service.ts`, `services/product_question.service.ts` |
| Repos | `repositories/review.repository.ts`, `repositories/product_question.repository.ts` |
| Admin UI | `components/admin/review/*`, `components/admin/qa/*` |
| Storefront | `ProductComments.tsx`, `ProductReviews.tsx`, `ProductQA.tsx` |
| RLS | `supabase/migrations/20260720193000_product_qa_public_rls.sql` |

---

## Related docs

- Index: `flow.md` (Admin → Engagement; User → ask product questions)
- Dashboard pending reviews / unanswered Q&A: `[02] Admin Flow - Dashboard.md`

**Highest-impact remaining:** none for these Engagement P1 Q&A items.
