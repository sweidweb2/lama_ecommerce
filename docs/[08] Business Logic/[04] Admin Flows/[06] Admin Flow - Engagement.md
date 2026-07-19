# Admin Flow — Engagement

**Scope:** Admin Engagement from `flow.md`: reviews moderation, Q&A manage/answer.  
**Out of scope:** Dashboard preview quirks (Dashboard doc); full public “ask a question” PDP (does not exist).

**Verdict:** Admin **list / edit-status / delete** for reviews and **list / create / answer / approve / delete** for Q&A largely work. **Storefront review submit is broken** (insert `approved` vs RLS requiring `pending`). **Admin “Create Review” is a dummy stub**. Q&A is **admin-only via service role** (no storefront ask UI; client RLS deny — intentional today).

---

## Happy path (what works today)

### Reviews
1. `/admin/reviews` → `getAllReviewsForAdminService` (`requireAdmin`) → session client + admin RLS → all statuses.
2. Stat cards + table filters (status, rating, product name) + client pagination.
3. Edit → `updateReviewAction` → status `pending|approved|rejected`, rating/title/comment → revalidate admin + product paths.
4. Delete → hard delete + revalidate.
5. Storefront PDP: `getProductReviews` shows `review_status = 'approved'` only (RLS aligned for SELECT).

### Q&A
1. `/admin/qa` → `getAllQuestionsAdmin` + products/profiles → `QATable`.
2. Create (real products/profiles) → SR insert; optional answer + `is_approved`.
3. View → first answer (`submitAnswerAction`); Edit → question / answer / approval; Delete → cascade answers.
4. Auth: actions `requireAdmin`; repo uses **service role** (bypasses empty Q&A client RLS).

```text
/admin/reviews
  → getAllReviewsForAdminService → requireAdmin → reviews (admin RLS)
  → updateReviewAction / deleteReviewAction → requireAdmin

/admin/qa
  → getAllQuestionsAdmin → requireAdmin → product_questions/answers (SR)
  → create/update/answer/delete → requireAdmin → SR mutate

Storefront review create
  → createReviewAction → insert review_status=approved
       ✗ RLS requires pending → submit fails
```

---

## P0 — Correctness (fix first)

- [ ] **User review insert sets `approved`; RLS requires `pending`**  
  Repo inserts `review_status: "approved"`. User INSERT policy: `auth.uid() = user_id AND review_status = 'pending'`. Non-admin submit fails; toast may still imply pending approval. Moderation queue stays empty.  
  **Where:** `repositories/review.repository.ts` (~71); RLS in initial migration; `ProductComments.tsx` toast; `lib/validators/product_review/create.ts`.  
  **Do:** Insert `pending`; align comments + toast; publish only via admin approve.

- [ ] **Admin “Create Review” is a stub**  
  Dummy products/users; `console.log` only; no DB write. Button looks real.  
  **Where:** `components/admin/review/create_form.tsx`.  
  **Do:** Wire admin create with real product/user lists, or remove the button.

---

## P1 — Incomplete / wrong engagement behavior

- [ ] **Auth/load failures look like an empty inbox**  
  Services catch `requireAdmin` → `[]`. Q&A page swallows errors → empty table.  
  **Where:** `services/review.service.ts`; `services/product_question.service.ts`; `app/admin/qa/page.tsx`.  
  **Do:** Propagate errors; show banner.

- [ ] **No one-click approve/reject** — status only via full Edit dialog.  
  **Where:** `ReviewsTable.tsx`; `edit_form.tsx`.  
  **Do:** Row actions calling `updateReviewAction({ review_status })`.

- [ ] **Review list/stats subject to ~1000-row PostgREST cap**  
  Unbounded select; page stats = loaded length.  
  **Where:** `repositories/review.repository.ts`; `app/admin/reviews/page.tsx`.  
  **Do:** Server pagination or exact counts.

- [ ] **Q&A edit can insert duplicate answers**  
  Saving with non-empty Answer appends another `product_answers` row (latest wins). Cannot clear via `null`.  
  **Where:** `updateQuestionAdmin`; `addProductAnswer`; `view_dialog.tsx`.  
  **Do:** Update latest answer or diff-before-insert.

- [ ] **Answering does not set `is_approved`**  
  Answer alone → “Pending Approval”; would stay hidden if public read existed.  
  **Where:** `submitAnswerAdmin` / `view_dialog.tsx`.  
  **Do:** Auto-approve on answer, or require explicit approve in UX.

- [ ] **No storefront Q&A surface**  
  Admin-only; RLS enabled with **no** client policies.  
  **Where:** no public Q&A components; RLS docs.  
  **Do:** Ship public ask + policies, or document “admin seed only”.

- [ ] **`admin_id` never recorded on answers**  
  **Where:** `actions/product_question.ts`; answer insert paths.  
  **Do:** Pass `requireAdmin().user_id`.

- [ ] **`is_active` ignored for `/admin`** — shared auth P0 (Customers / Guest Sign up).

---

## P2 — DX / UX

- [ ] Reviews: unused `avgRating` / imports not shown in UI  
- [ ] Q&A: approved-without-answer labeled “Pending”; filters name-only  
- [ ] Review actions: login check only; real gate in service (OK but inconsistent with Q&A)

---

## Deferred / works-as-implemented

| Behavior | Why OK / deferred |
|----------|-------------------|
| Storefront shows approved reviews only (SELECT) | Repo + UI + RLS |
| Q&A via service role, no client policies | Documented intentional |
| Hard delete reviews / questions | Cascade answers |
| Admin create/seed Q&A | Real DB path |
| Soft-delete / author self-edit | Out of scope |
| Feature test Q&A gates | `tests/feature/contact-qa-admin-auth.test.ts` |

---

## Edge-case matrix

| Edge case | Status |
|-----------|--------|
| Empty reviews/Q&A | Works — empty copy |
| User submits review | **Broken** — RLS vs `approved` (P0) |
| Admin approves/rejects via Edit | Works |
| Admin Create Review | Stub (P0) |
| Duplicate user review same product | Guarded (unique) |
| Q&A create with answer + approved | Works |
| Re-edit answer | Duplicate rows (P1) |
| Non-admin `/admin/reviews\|qa` | Middleware redirect |
| Inactive admin | Still allowed (shared) |
| Large review list | Silent truncate risk (P1) |
| Q&A load error | Silent empty (P1) |

---

## Sub-area status

| Sub-area | List | Create | Moderate / answer | Delete | Notes |
|----------|------|--------|-------------------|--------|-------|
| Reviews (admin) | OK | Stub | Edit status OK | OK | Storefront submit broken |
| Reviews (storefront write) | — | **Broken** | — | — | P0 RLS |
| Q&A (admin) | OK | OK | OK (dup answer P1) | OK | Admin-only SR |

---

## Key file map

| Concern | Path |
|---------|------|
| Pages | `app/admin/reviews/page.tsx`, `app/admin/qa/page.tsx` |
| Actions | `actions/review.ts`, `actions/product_question.ts` |
| Services | `services/review.service.ts`, `services/product_question.service.ts` |
| Repos | `repositories/review.repository.ts`, `repositories/product_question.repository.ts` |
| Admin UI | `components/admin/review/*`, `components/admin/qa/*` |
| Storefront | `ProductComments.tsx`, `ProductReviews.tsx` |
| Auth / nav | `middleware.ts`, `require-admin.ts`, `app-sidebar.tsx` |

---

## Related docs

- Index: `flow.md` (Admin → Engagement)
- Dashboard pending reviews / unanswered Q&A: `[02] Admin Flow - Dashboard.md`
- Auth `is_active`: Guest Sign up / Customers docs

**Highest-impact fixes:** insert reviews as `pending` → remove or wire Create Review stub → surface Q&A load errors → fix answer replace/`is_approved` UX.
