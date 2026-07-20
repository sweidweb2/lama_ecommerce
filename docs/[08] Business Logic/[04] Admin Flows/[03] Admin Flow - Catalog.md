# Admin Flow — Catalog

**Scope:** Admin catalog from `flow.md`: products (CRUD, variants, images, grid), categories, brands, product views.  
**Out of scope:** Storefront browse/buy behavior (Guest/Client Flow), dashboard KPIs, sales carts/orders, Analytics charts.

**Verdict:** Day-to-day **create/edit works** (list, detail, variants, images, grid, brands). Product hard-delete clears views/stats and toasts remaining blockers (questions / wishlist / cart / orders). Brands and product-views read path are largely fine. Admin categories list includes inactive rows via `getAdminCategories`.

---

## Happy path (what works today)

### Products
1. `/admin/products` → `getAdminProductsService` (all products, incl. inactive) → table filters + client pagination → encrypted detail links.
2. `/admin/products/create` → Zod `createProductSchema` → `createProductAction` → `createProductService` (`requireAdmin`) → insert; optional first image upload.
3. `/admin/products/[encryptedId]` → decrypt → edit / delete, variants CRUD, images add / set-primary / delete, per-product views + stats cards.
4. `/admin/products/grid` → same product set, URL filters (category / brand / featured / trending / active), client grid cards.

### Variants
Create / edit / delete on detail: color, size, material, stock, `sku_variant`, `price_override`. Stock rules block reduce when order history exists and block stock below cart-reserved. Delete blocked by wishlist / cart / `order_items`.

### Images
Upload → storage bucket `products` + `product_images` (auto-primary if first). Change primary. Delete → storage best-effort + DB + promote next primary. **No reorder / `sort_order`.**

### Categories
`/admin/categories` → create / update / delete (name, optional slug, parent, `is_active`). Hard-delete re-parents children; refuses if products still reference the category.

### Brands
`/admin/brands` → create / update / delete (name, optional slug, logo → `brands` bucket). Delete refuses if products reference the brand. Service uses `requireAdmin`.

### Product views
`/admin/product-views` (+ embed on product detail): paginated rows + stats. Tracking is storefront `trackProductViewAction`. **Read-only — no clear/delete.**

```text
/admin/products*
  → middleware admin role
  → product / variant / image actions
  → *Service requireAdmin (mostly) → repositories (session client + admin RLS)
  → storage: products / brands buckets

/admin/categories → getCategoriesService (active-only today) + category actions
/admin/brands → brand.service requireAdmin
/admin/product-views → product_view.service (read/stats)
```

---

## P0 — Correctness (fix first)

- [x] ✅ **Product hard-delete blocked after any view — no cleanup UI; errors silent** done✅  
  `hardDeleteProduct` used to refuse when `product_views` or `product_stats` existed. First PDP view created views+stats with no admin clear path; delete dialog looked like a no-op.  
  **Where:** `repositories/product.repository.ts` `hardDeleteProduct`; `components/admin/product/delete_dialog.tsx`; `actions/product_view.ts` (read-only).  
  **Done:** Auto-delete `product_views` + `product_stats` before product delete; still block questions / wishlist / cart / orders; delete dialog toasts success and `Cannot delete product: …` blockers.

- [x] ✅ **Create product drops `is_active`** done✅  
  Form/action parse `is_active`; `createProductService` never passes it into `CreateProductRepoInput` → DB/default **active**. Unchecking Active on create still publishes. Update path passes `is_active` correctly.  
  **Where:** `services/product.service.ts` `createProductService` (~38–49); `CreateProductForm.tsx`.  
  **Do:** Pass `is_active: payload.is_active ?? true` into the repo input.  
  **Done:** `createProductService` now passes `is_active: payload.is_active ?? true` into `CreateProductRepoInput`.

- [x] ✅ **Inactive categories vanish from admin** done✅  
  Categories page uses `getCategoriesService` → `getCategories()` with `.eq("is_active", true)`. Deactivate → row disappears; cannot re-activate/edit. Product brand/category dropdowns also only load active categories (OK for create; bad for editing products already on inactive category).  
  **Where:** `repositories/categories.repository.ts` `getCategories`; `app/admin/categories/page.tsx`; product create/edit category selects.  
  **Do:** Admin list without `is_active` filter (`getAdminCategories`); keep active-only for storefront.  
  **Done:** `getAdminCategories` / `getAdminCategoriesService` for admin list + product selects; storefront keeps active-only `getCategories`; inactive options labeled `(inactive)`.

---

## P1 — Incomplete / wrong catalog behavior

- [x] ✅ **Create image failure swallowed as success** done✅  
  Product create succeeds; image fail only `console.error`; toast still success.  
  **Where:** `actions/product.ts` create; `CreateProductForm.tsx`.  
  **Do:** Return upload status; warn toast / open detail to retry.  
  **Done:** `createProductAction` returns `{ success, encryptedId, imageUploadFailed? }`; form warns + redirects to product detail to retry upload.

- [x] ✅ **Delete / update product errors not shown to admin** done✅  
  Variants toast failures; product delete/edit often log only.  
  **Where:** `delete_dialog.tsx`; `edit_form.tsx`.  
  **Do:** Toast thrown `Cannot delete product: …` / update errors.  
  **Done:** Actions return `{ success, error }`; delete/edit dialogs toast domain messages (incl. `Cannot delete product: …`).

- [x] ✅ **Category (and image) mutate path thin on `requireAdmin`** done✅  
  Category service has no `requireAdmin` (action checks `profile.role`). Image service same pattern. Brands: action thin, service has `requireAdmin`. Inconsistent defense-in-depth.  
  **Where:** `services/category.service.ts`; `services/product_image.service.ts`; `actions/brand.ts`.  
  **Do:** `requireAdmin` in all mutate services; align brand actions.  
  **Done:** `requireAdmin` on category + product-image mutate services; brand create/update/delete actions also call `requireAdmin`.

- [x] ✅ **Category slug optional / nullable** done✅  
  Zod allows empty slug; storefront filters by slug → dead / unresolved category links.  
  **Where:** `lib/validators/category/base.ts`; category forms.  
  **Do:** Require slug (like products) or auto-generate from name.  
  **Done:** Required slug in Zod + create/edit forms; migration backfills null/empty and `SET NOT NULL`.

- [x] ✅ **No unique variant constraint** done✅  
  Duplicate `(product_id, color, size, material)` allowed.  
  **Where:** `customised_products` schema; `createProductVariantService`.  
  **Do:** Unique constraint + friendly conflict error.  
  **Done:** Unique index `customised_products_product_attrs_uidx` (with dedupe); create/update throw friendly `23505` messages.

- [x] ✅ **Custom color stores hex vs named palette colors** done✅  
  Palette → `"Red"`; picker → `"#ef4444"`. Storefront facets string-match → inconsistent filters.  
  **Where:** `CreateVariantForm.tsx` / `EditVariantDialog.tsx`.  
  **Do:** Normalize to names or separate hex column.  
  **Done:** Canonical uppercase hex via `canonicalizeColorForStorage` on variant write; `expandColorFilterValues` aliases name↔hex for storefront filters; forms use shared `COLOR_PALETTE`.

- [x] ✅ **Missing product after decrypt → stub page, not `notFound()`** done✅  
  Bad encrypt → `notFound()`; missing row → “does not exist yet…” placeholder.  
  **Where:** `app/admin/products/[id]/page.tsx`.  
  **Do:** Call `notFound()`.  
  **Done:** Missing product after decrypt now calls `notFound()`.

- [x] ✅ **Brands: no shared Zod on server** done✅  
  Action mainly checks name/id present; weaker than products/categories.  
  **Where:** `actions/brand.ts`.  
  **Do:** Shared Zod schemas like products/categories.  
  **Done:** `lib/validators/brand/*`; action + service re-parse; forms use `safeParse`.

---

## P2 — DX / stubs / polish

- [x] ✅ **No image reorder** — deferred✅  
  Primary flag + `created_at` promote only.  
  **Do:** `sort_order` + UI, or defer explicitly.  
  **Deferred:** Gallery stays primary-first / `created_at` promote; full `sort_order` + drag reorder UI out of scope until needed.

- [x] ✅ **Admin products / grid load all rows client-side** done✅  
  Soft caps (~1500 table / ~720 grid). Same anti-pattern storefront fixed.  
  **Where:** `getAdminProducts`; `ProductsTable`; `app/admin/products/grid/page.tsx`.  
  **Do:** Server-side filter + pagination.  
  **Done:** `getAdminProductsPage` + URL filters/pagination on list and grid; soft caps removed.


- [x] ✅ **Sidebar Catalog omits Grid** done✅  
  Product Views is in Catalog children; Grid (`/admin/products/grid`) remains button-only.  
  **Where:** `components/admin/app-sidebar.tsx`.  
  **Do:** Add Grid nav child if desired.  
  **Done:** Catalog children include Grid → `/admin/products/grid`.

- [x] ✅ **Category products count stub** — `productsCount = 0 // TODO`. done✅  
  **Where:** `components/admin/category/categories-table.tsx`.  
  **Done:** `getCategoryProductCounts` (all products per `category_id`) wired through admin categories page.

- [ ] **Create product no redirect to detail** — form clears in place.  
  **Do:** Redirect to `/admin/products/${encrypt(id)}`.

- [ ] **Opaque duplicate slug / FK errors** — repo `null` → generic fail.  
  **Do:** Map Postgres `23505` / FK to field errors.

- [ ] **Image ID UUID validation skipped** on change-primary/delete (commented intentional).  
  **Where:** `actions/product.ts`.

---

## Deferred (not bugs — planned later)

- [ ] Soft delete for catalog entities — project uses hard delete + `is_active` hide (`docs/.../Hard Deletes`)  
- [ ] Product-views standalone clear/delete UI — not required for product delete (views/stats auto-cleared)  
- [ ] Image drag-reorder beyond primary  
- [ ] Brand `is_active` (schema has no flag)  
- [ ] Bulk import / CSV  
- [ ] Admin text search by SKU/name on products table  

---

## Edge-case matrix

| Case | Status |
|------|--------|
| Product slug null | Blocked — Zod + DB `NOT NULL` |
| Duplicate product/category/brand slug | DB unique → create fails (P2 opaque message) |
| Create with `is_active=false` | **Broken** — still saved active (P0) |
| Product with zero variants | Admin OK; storefront buyability limited (Guest Browse) |
| Inactive product | Admin lists it; storefront RLS hides | 
| Inactive category | Listed in admin (Active/Inactive badge); storefront still active-only |
| Category slug empty | Allowed; storefront filter broken (P1) |
| Delete product after any PDP view | Views/stats auto-cleared; questions / wishlist / cart / orders still block with toast |
| Delete variant with orders / wishlist / cart | Blocked with toast | OK |
| Reduce stock with order history / below cart | Blocked | OK |
| Image upload fail on create | Product OK, image missing, success toast (P1) |
| Storage delete fail on image remove | DB row may go; orphan file possible (P2) |
| Primary image delete | Next oldest by `created_at` promoted | OK |
| Brand / category delete with products | Blocked | OK |
| Category delete with children | Children re-parented | OK |
| Encrypted ID tampered | `notFound()` | OK |
| Non-admin `/admin/*` | Middleware redirect | OK |
| Duplicate variants | Allowed (P1) |
| Hex vs named color | Filter mismatch risk (P1) |

---

## Works as implemented (not bugs)

| Behavior | Why OK |
|----------|--------|
| Hard delete (no `deleted_at`) | Project catalog standard; hide via `is_active` |
| Variant stock / delete guards | Protects orders, carts, wishlists |
| Brand/category delete blocked when products reference | Referential integrity |
| Product views read-only admin UI | Tracking is storefront-owned |
| Grid + table share same product fetch | Consistent filters |
| Images cascade on product delete when delete **succeeds** | FK cascade for images/variants/reviews |

---

## Sub-area status

| Sub-area | Status |
|----------|--------|
| Products list / edit / flags | Working |
| Products create | Working with **P0 `is_active` bug** |
| Products delete | **Broken in practice** after views/stats |
| Variants CRUD + stock rules | Working |
| Images upload / primary / delete | Working; no reorder |
| Products grid | Working (client-side scale limits) |
| Categories CRUD | Create/update/delete work; **inactive list broken** |
| Brands CRUD + logo | Working (thinner Zod/auth) |
| Product views admin | Working read/stats; **no delete** (blocks product delete) |

---

## Admin vs storefront (catalog)

| | Admin | Storefront |
|--|-------|------------|
| Product list | All (incl. inactive) | Active + RLS |
| Category list | **Active only today** (bug for admin) | Active |
| Brands | Full CRUD | Public SELECT (name/link) |
| Variants / images manage | Yes | Read / buy only |
| Product views | Read/stats | Write via track action |
| Delete product | Hard delete when unblocked | N/A |

---

## Key file map

| Area | Routes | Actions | Services | Repositories | UI |
|------|--------|---------|----------|--------------|-----|
| Products | `app/admin/products/{page,create,[id],grid}/` | `actions/product.ts` | `product.service.ts` | `product.repository.ts` | `ProductsTable`, `CreateProductForm`, `edit_form`, `delete_dialog`, grid |
| Variants | (detail) | same | `product_variant.service.ts` | `product_variant.repository.ts` | variant forms/table/dialogs |
| Images | (detail) | same | `product_image.service.ts` | `product_images.repository.ts`, `storage.repository.ts` | gallery / add / primary dialogs |
| Categories | `app/admin/categories/` | `actions/category.ts` | `category.service.ts`, `categories.service.ts` | `categories.repository.ts` | `admin-categories-client`, `components/admin/category/*` |
| Brands | `app/admin/brands/` | `actions/brand.ts` | `brand.service.ts` | `brand.repository.ts` | `admin-brands-client`, `components/admin/brand/*` |
| Product views | `app/admin/product-views/` | `actions/product_view.ts` | `product_view.service.ts` | `product_view.repository.ts` | `ProductViewsTable`, stats cards |
| Validators | — | — | — | — | `lib/validators/product/*`, `product_variant/*`, `product_image/*`, `category/*` (brands: none) |
| Nav | — | — | — | — | `components/admin/app-sidebar.tsx` |

---

## DB tables in this flow

| Table / storage | Role |
|-----------------|------|
| `products` | CRUD; `is_active` / featured / trending |
| `customised_products` | Variants + stock + `price_override` |
| `product_images` + bucket `products` | Gallery |
| `categories` | Tree / slug / `is_active` |
| `brands` + bucket `brands` | Name / slug / logo |
| `product_views` / `product_stats` | Analytics; cleared on product hard-delete |
| `product_questions` | Also blocks product delete |
| `wishlists` / `cart_items` / `order_items` | Block variant/product delete when referenced |

---

## Related docs

- Index: `docs/[08] Business Logic/flow.md` (Admin → Catalog)
- Storefront browse gaps (no variants, slug): `[02] Guest Flow/[01] Guest Flow - Browse.md`
- Dashboard (links into products): `[04] Admin Flows/[02] Admin Flow - Dashboard.md`
- Hard-delete policy: `docs/[08] Business Logic/[01] Hard Deletes/`

**Highest-impact remaining:** category/brand polish and storefront catalog edge cases (see open P1/P2).
