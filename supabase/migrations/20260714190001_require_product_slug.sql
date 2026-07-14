-- Backfill null/empty product slugs, then require slug going forward.
-- Storefront routes are /products/[slug]; links with null/id 404 against getProductBySlug.

UPDATE products
SET slug = left(
  trim(
    both '-'
    from regexp_replace(
      lower(coalesce(nullif(btrim(name), ''), 'product')),
      '[^a-z0-9]+',
      '-',
      'g'
    )
  )
  || '-'
  || left(replace(id::text, '-', ''), 8),
  40
)
WHERE slug IS NULL OR btrim(slug) = '';

ALTER TABLE products
  ALTER COLUMN slug SET NOT NULL;
