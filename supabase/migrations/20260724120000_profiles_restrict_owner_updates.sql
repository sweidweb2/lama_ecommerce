-- Restrict owner self-updates on profiles to full_name only.
-- Extends prevent_role_change so owners cannot change role, is_active,
-- user_id, id, or created_at. Admins updating other users are unaffected.

CREATE OR REPLACE FUNCTION public.prevent_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.user_id = auth.uid() THEN
    IF OLD.role IS DISTINCT FROM NEW.role
       OR OLD.is_active IS DISTINCT FROM NEW.is_active
       OR OLD.user_id IS DISTINCT FROM NEW.user_id
       OR OLD.id IS DISTINCT FROM NEW.id
       OR OLD.created_at IS DISTINCT FROM NEW.created_at THEN
      RAISE EXCEPTION
        'Users can only update full_name on their own profile.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
