-- Paginated admin profiles (avoids PostgREST max_rows silent truncation).

CREATE OR REPLACE FUNCTION public.get_admin_profiles_page(
  p_limit integer,
  p_offset integer,
  p_query text DEFAULT NULL,
  p_role text DEFAULT NULL,
  p_is_active boolean DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  full_name text,
  role profile_role,
  created_at timestamptz,
  is_active boolean,
  email text,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit integer := GREATEST(1, LEAST(COALESCE(p_limit, 20), 100));
  v_offset integer := GREATEST(0, COALESCE(p_offset, 0));
  v_query text := NULLIF(TRIM(COALESCE(p_query, '')), '');
  v_role profile_role;
BEGIN
  IF public.get_user_role() != 'admin'::profile_role THEN
    RETURN;
  END IF;

  IF p_role IS NOT NULL AND TRIM(p_role) <> '' THEN
    BEGIN
      v_role := TRIM(p_role)::profile_role;
    EXCEPTION WHEN others THEN
      v_role := NULL;
    END;
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.user_id,
    p.full_name,
    p.role,
    p.created_at,
    p.is_active,
    u.email::text,
    COUNT(*) OVER()::bigint AS total_count
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.user_id
  WHERE
    (v_role IS NULL OR p.role = v_role)
    AND (p_is_active IS NULL OR p.is_active = p_is_active)
    AND (
      v_query IS NULL
      OR p.full_name ILIKE '%' || v_query || '%'
      OR u.email::text ILIKE '%' || v_query || '%'
    )
  ORDER BY p.created_at DESC
  LIMIT v_limit
  OFFSET v_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_profiles_page(
  integer,
  integer,
  text,
  text,
  boolean
) TO authenticated;
