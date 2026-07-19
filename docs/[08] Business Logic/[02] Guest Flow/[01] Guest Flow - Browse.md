# Guest Flow — Browse

**Scope:** Browse home → catalog → search → product detail pages (guest / anon).  
**Out of scope:** Cart, checkout, wishlist, auth, contact, newsletter.

**Verdict:** Core browse works for **active** products with a slug and (for buyability) **at least one variant**. Brands load for guests via public SELECT. Remaining gaps are mostly P1 filters/sort stubs — use the checklists below.

---

## Happy path (what works today)

1. Open `/` → hero / promo banners (editorial static) → featured products (`is_featured`) → category tiles (real DB counts/covers).
2. Open `/products` → active products via anon RSC client + RLS `is_active = true`.
3. Filter by category / price / search; sort by newest / price / name; paginate (12/page).
4. Search via navbar → `/search?q=…&sort=…` (name / description / SKU / brand; sortable) or catalog bar → `/products?search=…` (with catalog filters).
5. Open `/products/[slug]` → images, variants (color/size/material), base / `price_override` when a variant is selected, related products, approved reviews, view tracking.

```text
/  → FeaturedProducts (getProducts is_featured)
      → /products?[category|brand|sort|minPrice|maxPrice|search|page]
           → getCategoriesService + getProducts + getProductPriceBounds
      → /search?q=&sort=  → getProducts(search across name/description/sku/brand)
      → /products/[slug]
           → getProductBySlug (active only)
           → variants + reviews + related
           → ProductViewTracker → product_views + product_stats
```

---

## P0 — Correctness (fix first)

- [x] ✅ **No public SELECT on `brands` (brands never load for guests)** done✅  
  RLS only has `"Admins can manage brands"`. Guests cannot SELECT brands. Product embed `brand:brands(*)` yields `null`; brand name/link on PDP never appears. Phase docs claim public brand read; migrations never ship it.  
  **Where:** `supabase/migrations/20260126141860_initial.sql` (brands policies ~749); `repositories/product.repository.ts` (`PRODUCT_SELECT`); `ProductCoreInfo.tsx`.  
  **Do:** Add `Public can read brands` `FOR SELECT USING (true)` (or equivalent).  
  **Done:** Migration `20260714190000_public_read_brands.sql` adds `Public can read brands` `FOR SELECT USING (true)`. Guest product embeds resolve brand name/link on PDP.

- [x] ✅ **Null / missing product slug → dead catalog links** done✅  
  Slug is optional in schema + Zod. `ProductCard` links `/products/${slug || id}`; `getProductBySlug` only matches `slug` → **404**. Featured uses `` `/products/${product.slug}` `` → `/products/null` / broken when slug is null.  
  **Where:** `components/common/ProductCard.tsx`; `components/(public)/Home/FeaturedProducts.tsx`; `repositories/product.repository.ts` `getProductBySlug`; `lib/validators/product/base.ts`.  
  **Do:** Require slug on create, or resolve by id, or hide slug-less products from storefront.  
  **Done:** Slug required in Zod + admin create/edit; migration `20260714190001_require_product_slug.sql` backfills null/empty slugs then `NOT NULL`. Storefront cards link by slug only (no id fallback).

---

## P1 — Incomplete / wrong browse behavior

- [x] ✅ **“Size: XS-XL” sort does nothing useful** done✅  
  Sorting UI offers `size-asc`. Repo allowlist is only `created_at` / `price` / `name`; anything else falls back to `created_at-desc`. Guest thinks they’re sorting by size; they get Newest.  
  **Where:** `components/(public)/products/Sorting.tsx`; `repositories/product.repository.ts` (~139–147).  
  **Do:** Implement real size sort (join variants) or remove the option.  
  **Done:** Removed `Size: XS-XL` (`size-asc`) from sort options; stale/`unknown` sort values normalize to Newest in the UI.

- [x] ✅ **Brand link on PDP is a dead filter** done✅  
  `ProductCoreInfo` links `/products?brand=${brand.slug}`. Catalog page only reads `category` / `sort` / `page` / `search` / `minPrice` / `maxPrice` — **not** `brand`. Even after brands RLS is fixed, click shows unfiltered catalog.  
  **Where:** `ProductCoreInfo.tsx`; `app/(public)/products/page.tsx`; `getProducts` supports `brandId` but page never passes it.  
  **Do:** Accept `brand` query param, resolve slug → id, pass `brandId`.  
  **Done:** Page reads `brand`; service resolves `brandSlug` via `getBrandIdBySlug` and passes `brandId` to the repo (mirrors category).

- [x] ✅ **Unknown / inactive category slug silently shows all products** done✅  
  If `getCategoryIdBySlug` returns `null`, `getProducts` applies **no** category filter (full active catalog). Hardcoded home categories can break the same way if slugs diverge from DB.  
  **Where:** `services/product.service.ts`; `repositories/categories.repository.ts` `getCategoryIdBySlug`; `app/(public)/products/page.tsx`; `CategoryShowcase.tsx`.  
  **Do:** If slug present and unresolved → empty result (or 404), not “all products”; resolve only active categories.  
  **Done:** `getCategoryIdBySlug` filters `is_active = true`; unresolved `categorySlug` returns `{ data: [], count: 0 }` from `getProducts` (no full-catalog fallback).

- [x] ✅ **PDP price can stick after deselecting variant** done✅  
  On match, `setSelectedVariantId(variant.id)`. On clear (toggle off color/size/material), effect does **not** set `null`, so `ProductPricing` keeps showing the last override.  
  **Where:** `ProductCustomization.tsx` (~195–199); `ProductPricing.tsx`; `ProductVariantProvider.tsx`.  
  **Do:** `setSelectedVariantId(null)` when no matched variant.  
  **Done:** Sync effect clears `selectedVariantId` when `selectedVariant` is undefined so price resets to base.

- [x] ✅ **Products with zero variants: browse-only (no ATC UI)** done✅  
  Customization (and thus ATC) only renders when `variants.length > 0`. Guest sees price/details but cannot buy from PDP.  
  **Where:** `app/(public)/products/[slug]/page.tsx`.  
  **Do:** Block publish without variants, or show a clear empty state / default variant.  
  **Done:** PDP empty state when `variants.length === 0` (“No purchase options available…”); ATC still gated; admin activate not blocked.

- [x] ✅ **Listing / filter / sort / featured price ignore `price_override`** done✅  
  Cards and price slider use `products.price` only. Variant-priced catalog can sort/filter/display wrong vs checkout (`COALESCE(price_override, base)`).  
  **Where:** `ProductCard.tsx`; `FeaturedProducts.tsx`; `getProductPriceBounds` / price filters in `product.repository.ts`.  
  **Do:** Display/filter using variant-aware min/max (or document base-only and hide overrides on list).  
  **Done:** Migration `20260714200000_product_effective_prices.sql` adds `min_effective_price` / `max_effective_price` (kept in sync by triggers). Cards/featured/related use `From {min}` via `formatListingPrice`; filter uses range overlap; sort/bounds use effective prices.

- [x] ✅ **`colors` / `sizes` query params are accepted but never applied** done✅  
  Page types `colors` / `sizes`; nothing is passed into `getProducts`. Filter components exist but are **not mounted**.  
  **Where:** `app/(public)/products/page.tsx`; unused `VariantFilters.tsx` / `SizeFilter.tsx` / `VariantFilterButton.tsx`.  
  **Do:** Wire server-side filters or remove params/UI.  
  **Done:** DB-backed facets from `customised_products`; `getProducts` filters by color/size (same-variant AND); `VariantFilters` / `SizeFilter` mounted in sidebar + mobile. `VariantFilterButton` left unmounted.

- [x] ✅ **PDP “stats” always show 0** done✅  
  `PRODUCT_SELECT` does not include `product_stats`; `product_stats` is admin-only RLS. `product.stats` is always missing → Reviews UI shows 0 views/ATC/purchases while views are written separately.  
  **Where:** `repositories/product.repository.ts`; `app/(public)/products/[slug]/page.tsx`; `ProductReviews.tsx`.  
  **Do:** Fetch aggregate counts via service/admin or a safe public read policy.  
  **Done:** Migration `20260714210000_public_read_product_stats.sql` adds public SELECT; `PRODUCT_SELECT` embeds `stats:product_stats(*)`.

---

## P2 — DX / stubs / SEO / UX

- [x] ✅ **Home category showcase is hardcoded fake data** done✅  
  Unsplash images + fabricated counts (“1,200 Products”), not `getCategoriesService`. Can diverge from real catalog.  
  **Where:** `components/(public)/Home/CategoryShowcase.tsx`.  
  **Do:** Load real categories/counts from DB.  
  **Done:** `getHomeCategoriesService` loads active categories with product counts + product cover images; home page passes props into `CategoryShowcase`.

- [x] ✅ **Home / promos / hero are marketing stubs** done✅  
  Static Unsplash hero; CTAs go to `/products`; “Up to 50% Off” has no promo wiring.  
  **Where:** `Hero.tsx`, `PromotionalBanners.tsx`.  
  **Do:** DB-driven banners / real links / honest copy (or mark as placeholder).  
  **Done:** Editorial constants in `lib/constants/home-marketing.ts`; honest copy; CTAs to `/products` and real category filters. No homepage CMS.

- [x] ✅ **SEO / metadata gaps on browse surfaces** done✅  
  No `generateMetadata` on `/`, `/products`, or `/products/[slug]` (only root site title). Search title branding may diverge from site name. No product OG/title/description.  
  **Where:** `app/page.tsx`; `app/(public)/products/page.tsx`; `app/(public)/products/[slug]/page.tsx`; `app/(public)/search/page.tsx`; `app/layout.tsx`.  
  **Do:** Per-route + dynamic PDP metadata.  
  **Done:** Root title template `%s | Aviora Wear`; catalog/search metadata; PDP `generateMetadata` via `productToMetadata`.

- [x] ✅ **Dead PDP helpers / noisy review UI** done✅  
  `ProductAvailability` / `ProductVariantSelector` unused. Reviews summary + `ProductComments` both surface reviews; guest review form looks open then forces login.  
  **Where:** `product_details/*`; `ProductComments.tsx`; `actions/review.ts`.  
  **Do:** Delete or wire; guest CTA “Sign in to review”.  
  **Done:** Removed unused availability helper; guest review CTA “Sign in to review” with redirect back to PDP.

- [x] ✅ **Search is name `ilike` only; sort fixed to newest** done✅  
  No description / SKU / brand match; no filters on `/search`.  
  **Where:** `app/(public)/search/page.tsx`; `getProducts` search clause.  
  **Do:** Expand match fields / optionally share catalog filters.  
  **Done:** `getProducts` matches name / description / SKU / brand name via `.or()`; `/search` accepts `sort` and reuses `Sorting` (`basePath=/search`). Catalog filters stay on `/products`.

- [x] ✅ **`getProducts` swallows DB errors as empty catalog** done✅  
  Guest sees “No products” on failure, not an error.  
  **Where:** `repositories/product.repository.ts` (~158–168).  
  **Do:** Surface error / log + UI.  
  **Done:** Repo logs and throws on DB failure; `/search/error.tsx` + existing `/products/error.tsx` show the shared error UI. Soft callers (`FeaturedProducts`, `getRelatedProducts`) catch and soft-empty.

- [x] ✅ **OOS products still list with no stock signal** done✅  
  Active products with all-zero stock still appear; only PDP shows out-of-stock after variant pick.  
  **Where:** listing via `is_active` only; stock on `customised_products`.  
  **Done:** Listings keep OOS products; `getProducts` attaches `is_out_of_stock` from variant stock; Out of Stock badge on ProductCard / Featured / Related.

- [x] ✅ **Architecture: PDP bypasses service layer** done✅  
  Page calls `getProductBySlug` from repository directly (project rules say services).  
  **Where:** `app/(public)/products/[slug]/page.tsx`.  
  **Done:** `getProductBySlugService` in `product.service.ts`; PDP page + metadata use it.

---

## Deferred (not browse bugs)

- [ ] Guest review submit requiring login (intentional auth gate)  
- [ ] Cart / wishlist from PDP (separate guest flows)  
- [ ] Stripe / client payment UI (buying flow)

---

## DB tables in this flow

| Table | Role |
|-------|------|
| `products` | Catalog (active only for guests) |
| `product_images` | Gallery / cards |
| `customised_products` | Variants, stock, `price_override` |
| `categories` | Filters + PDP / home links |
| `brands` | Public SELECT; PDP / product embeds |
| `reviews` | Approved reads on PDP |
| `product_views` | Guest/user view rows |
| `product_stats` | View/ATC/purchase increments (admin client); public SELECT for PDP display |

---

## Guest access notes

| Concern | Behavior |
|--------|----------|
| Route access | `/`, `/products`, `/search`, `/products/[slug]` public; middleware mints `guest_session_id` |
| Product read | RLS `is_active = true` + app `.eq("is_active", true)` |
| Images / variants | Public SELECT for active parent products |
| Categories | Public read + app `is_active` on listing helpers |
| Brands | Public SELECT (`Public can read brands`); embedded on PDP |
| Views | Guests insert `product_views` with `session_id`; stats bump via admin client |
| Search / filters | Anon RSC Supabase client; no admin client on listing |
| Security | Inactive products hidden; catalog reads not service-role |

---

**Highest-impact remaining:** (browse P0–P2 checklist items above are done; deferred items are intentional auth / cart / payment scope.)
