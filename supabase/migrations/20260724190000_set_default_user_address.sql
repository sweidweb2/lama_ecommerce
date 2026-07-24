-- Atomic set-default for user_addresses.
-- Verifies ownership via auth.uid(), sets target default, then clears others.
-- Prevents clear-then-set leaving zero defaults when id is missing/foreign.

CREATE OR REPLACE FUNCTION public.set_default_user_address(p_address_id uuid)
RETURNS public.user_addresses
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.user_addresses%ROWTYPE;
BEGIN
  IF p_address_id IS NULL THEN
    RAISE EXCEPTION 'Address id is required';
  END IF;

  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.user_addresses
  SET is_default = true
  WHERE id = p_address_id
    AND user_id = auth.uid()
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Address not found';
  END IF;

  UPDATE public.user_addresses
  SET is_default = false
  WHERE user_id = auth.uid()
    AND id <> p_address_id
    AND is_default = true;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.set_default_user_address(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_default_user_address(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.set_default_user_address(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_default_user_address(uuid) TO service_role;

NOTIFY pgrst, 'reload schema';
