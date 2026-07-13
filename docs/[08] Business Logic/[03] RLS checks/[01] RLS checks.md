# RLS checks

**Posture:** RLS on all app tables (deny-by-default). Public catalog read · owner CRUD · admin via `get_user_role() = 'admin'` · guests via **service_role + cookie** (no anon row access). Soft deletes removed → [Hard Deletes](../[01]%20Hard%20Deletes/[01]%20Hard%20Deletes.md). App path: repositories → services → actions (admin gated on mutate).

## Matrix

| Area | Public | User | Admin | Notes |
|------|--------|------|-------|-------|
| Catalog (products, categories, images, variants, shipping zones) | read active | — | full | products/images require active product |
| Brands | — | — | full | admin-only table RLS |
| Reviews | read approved | insert own | full | |
| Profiles / addresses | — | own | profiles manage | role change blocked by trigger |
| Cart / order / wishlist | — | own | full | guests = SR + session cookie |
| Payments / shipments | — | via own order | full | |
| Promo / stats / backups | — | — | / SR | backups deny-all → SR |
| Contact / leads | — | — | read/manage | public insert closed; app insert via SR + rate limit |
| Q&A | — | — | via SR | RLS on, no policies (intentional) |

## Storage / images

- **`products` bucket:** public read; admin insert/update/delete (`20260712220000_restore_product_image_policies.sql`).
- **`product_images` table:** public SELECT for active products; admin ALL.
- **`brands` bucket:** admin upload; logos via brand service + storage repo.

## Intentional service-role paths

Guest cart/order/wishlist · `process_checkout` · contact/lead inserts · Q&A · backups · form rate limits — not missing RLS.

## Verify

Live PostgREST checks: [RLS Checklist](../../[02]%20Tests/[02]%20RLS%20ChecklistT.md). After `npx supabase db push`, mark checklist rows.
