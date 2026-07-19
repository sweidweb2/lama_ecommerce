-- Enforce one lead per normalized email (lower(trim(email))).
-- Public re-subscribe becomes idempotent; admin create/update gets clear conflicts.

---------------------------------------------------
-- 1. Dedupe (keep earliest created_at per normalized email)
---------------------------------------------------

CREATE TEMP TABLE _lead_keepers AS
SELECT DISTINCT ON (lower(trim(email)))
  id AS keeper_id,
  lower(trim(email)) AS email_key
FROM leads
ORDER BY lower(trim(email)), created_at ASC NULLS LAST, id ASC;

DELETE FROM leads AS l
USING _lead_keepers k
WHERE lower(trim(l.email)) = k.email_key
  AND l.id <> k.keeper_id;

DROP TABLE _lead_keepers;

---------------------------------------------------
-- 2. Normalize remaining emails
---------------------------------------------------

UPDATE leads
SET email = lower(trim(email));

---------------------------------------------------
-- 3. Unique index + drop obsolete non-unique index
---------------------------------------------------

DROP INDEX IF EXISTS idx_leads_email;

CREATE UNIQUE INDEX leads_email_normalized_uidx
  ON leads (lower(trim(email)));
