--------------------------------------------------
-- Lock search_path on get_user_role()
--
-- SECURITY DEFINER helpers must pin search_path to avoid
-- search_path hijacking / object shadowing attacks.
--------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS profile_role
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  user_role profile_role;
BEGIN
  SELECT role INTO user_role
  FROM public.profiles
  WHERE user_id = auth.uid()
  LIMIT 1;

  RETURN coalesce(user_role, 'user'::profile_role);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;
