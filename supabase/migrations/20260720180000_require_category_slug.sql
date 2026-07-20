-- Backfill null/empty category slugs, then require slug going forward.
-- Storefront filters by category slug (/products?category=...); null/empty breaks links.

UPDATE categories
SET slug = left(
  trim(
    both '-'
    from regexp_replace(
      lower(coalesce(nullif(btrim(name), ''), 'category')),
      '[^a-z0-9]+',
      '-',
      'g'
    )
  )
  || '-'
  || left(replace(id::text, '-', ''), 8),
  20
)
WHERE slug IS NULL OR btrim(slug) = '';

ALTER TABLE categories
  ALTER COLUMN slug SET NOT NULL;
