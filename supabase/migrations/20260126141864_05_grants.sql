-- Grants / revokes (final function signatures only)
-- Historical GRANT/REVOKE on dropped overloads removed — those fail on a fresh DB.

-- get_user_role
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;

-- get_admin_profiles
GRANT EXECUTE ON FUNCTION public.get_admin_profiles() TO authenticated;

-- upsert_cart_item: authenticated + service_role only (not anon)
REVOKE ALL ON FUNCTION public.upsert_cart_item(uuid, uuid, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.upsert_cart_item(uuid, uuid, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.upsert_cart_item(uuid, uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_cart_item(uuid, uuid, integer) TO service_role;

-- process_checkout: service_role only (final signature with optional p_promo_code)
REVOKE ALL ON FUNCTION public.process_checkout(uuid, uuid, uuid, text, text, text, jsonb, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.process_checkout(uuid, uuid, uuid, text, text, text, jsonb, text) FROM anon;
REVOKE ALL ON FUNCTION public.process_checkout(uuid, uuid, uuid, text, text, text, jsonb, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.process_checkout(uuid, uuid, uuid, text, text, text, jsonb, text) TO service_role;

-- check_form_rate_limit: service_role only
REVOKE ALL ON FUNCTION public.check_form_rate_limit(text, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.check_form_rate_limit(text, integer, integer) FROM anon;
REVOKE ALL ON FUNCTION public.check_form_rate_limit(text, integer, integer) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.check_form_rate_limit(text, integer, integer) TO service_role;

-- get_admin_profiles_page
GRANT EXECUTE ON FUNCTION public.get_admin_profiles_page(
  integer,
  integer,
  text,
  text,
  boolean
) TO authenticated;

-- admin analytics RPCs: service_role only
REVOKE ALL ON FUNCTION public.admin_top_products_by_revenue(integer, timestamptz, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_top_products_by_revenue(integer, timestamptz, timestamptz) TO service_role;

REVOKE ALL ON FUNCTION public.admin_orders_revenue_sum(timestamptz, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_orders_revenue_sum(timestamptz, timestamptz) TO service_role;

-- set_default_user_address
REVOKE ALL ON FUNCTION public.set_default_user_address(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_default_user_address(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.set_default_user_address(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_default_user_address(uuid) TO service_role;

NOTIFY pgrst, 'reload schema';
