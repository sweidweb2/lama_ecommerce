-- Hourly job: deactivate promo codes whose expires_at has passed.
-- Checkout already rejects expired codes; this keeps is_active in sync for admin UI/filters.

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.expire_promo_codes()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count integer;
BEGIN
  UPDATE public.promo_codes
  SET is_active = false
  WHERE is_active = true
    AND expires_at IS NOT NULL
    AND expires_at <= now();

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

COMMENT ON FUNCTION public.expire_promo_codes() IS
  'Sets is_active = false for promo codes whose expires_at is at or before now(). Run hourly via pg_cron.';

REVOKE ALL ON FUNCTION public.expire_promo_codes() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.expire_promo_codes() TO postgres;

-- Idempotent reschedule: drop existing job if present, then schedule hourly at :00
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM cron.job
    WHERE jobname = 'expire-promo-codes'
  ) THEN
    PERFORM cron.unschedule('expire-promo-codes');
  END IF;
END;
$$;

SELECT cron.schedule(
  'expire-promo-codes',
  '0 * * * *',
  $$SELECT public.expire_promo_codes()$$
);
