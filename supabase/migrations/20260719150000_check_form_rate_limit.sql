-- Atomic form rate-limit check for contact/lead public actions.
-- Replaces non-atomic read → decide → write (TOCTOU) and enables fail-closed TS.

CREATE OR REPLACE FUNCTION public.check_form_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.form_rate_limits%ROWTYPE;
  v_now timestamptz := now();
BEGIN
  IF p_key IS NULL OR length(trim(p_key)) = 0 THEN
    RAISE EXCEPTION 'p_key is required';
  END IF;
  IF p_limit IS NULL OR p_limit < 1 THEN
    RAISE EXCEPTION 'p_limit must be >= 1';
  END IF;
  IF p_window_seconds IS NULL OR p_window_seconds < 1 THEN
    RAISE EXCEPTION 'p_window_seconds must be >= 1';
  END IF;

  -- Lock existing row if present
  SELECT * INTO v_row
  FROM public.form_rate_limits
  WHERE key = p_key
  FOR UPDATE;

  IF NOT FOUND THEN
    BEGIN
      INSERT INTO public.form_rate_limits (key, window_started_at, hit_count)
      VALUES (p_key, v_now, 1);
      RETURN true;
    EXCEPTION
      WHEN unique_violation THEN
        -- Concurrent first insert: lock winner and continue
        SELECT * INTO v_row
        FROM public.form_rate_limits
        WHERE key = p_key
        FOR UPDATE;
    END;
  END IF;

  IF v_now - v_row.window_started_at >= make_interval(secs => p_window_seconds) THEN
    UPDATE public.form_rate_limits
    SET window_started_at = v_now,
        hit_count = 1
    WHERE key = p_key;
    RETURN true;
  END IF;

  IF v_row.hit_count >= p_limit THEN
    RETURN false;
  END IF;

  UPDATE public.form_rate_limits
  SET hit_count = hit_count + 1
  WHERE key = p_key;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.check_form_rate_limit(text, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.check_form_rate_limit(text, integer, integer) FROM anon;
REVOKE ALL ON FUNCTION public.check_form_rate_limit(text, integer, integer) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.check_form_rate_limit(text, integer, integer) TO service_role;

NOTIFY pgrst, 'reload schema';
