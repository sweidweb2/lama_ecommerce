-- Lead consent / unsubscribe fields for marketing list hygiene.

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS status text,
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS unsubscribed_at timestamptz,
  ADD COLUMN IF NOT EXISTS unsubscribe_token uuid;

-- Backfill existing rows before NOT NULL / defaults
UPDATE public.leads
SET
  status = COALESCE(status, 'subscribed'),
  source = COALESCE(source, 'footer'),
  unsubscribe_token = COALESCE(unsubscribe_token, gen_random_uuid())
WHERE status IS NULL
   OR source IS NULL
   OR unsubscribe_token IS NULL;

ALTER TABLE public.leads
  ALTER COLUMN status SET DEFAULT 'subscribed',
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN source SET DEFAULT 'footer',
  ALTER COLUMN source SET NOT NULL,
  ALTER COLUMN unsubscribe_token SET DEFAULT gen_random_uuid(),
  ALTER COLUMN unsubscribe_token SET NOT NULL;

ALTER TABLE public.leads
  DROP CONSTRAINT IF EXISTS leads_status_check;

ALTER TABLE public.leads
  ADD CONSTRAINT leads_status_check
  CHECK (status IN ('subscribed', 'unsubscribed'));

ALTER TABLE public.leads
  DROP CONSTRAINT IF EXISTS leads_source_check;

ALTER TABLE public.leads
  ADD CONSTRAINT leads_source_check
  CHECK (source IN ('footer', 'admin', 'unknown'));

CREATE UNIQUE INDEX IF NOT EXISTS leads_unsubscribe_token_uidx
  ON public.leads (unsubscribe_token);
