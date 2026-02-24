-- ============================================================
-- Fix handle_new_user() to handle conflicts (re-invited users)
-- Created: 2026-02-24
-- Description: Add ON CONFLICT handling to prevent trigger failure
--              when re-inviting users
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Use INSERT ... ON CONFLICT to handle re-invited users
  INSERT INTO public.user_profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
    email = EXCLUDED.email,
    role = COALESCE(EXCLUDED.role, user_profiles.role),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION handle_new_user IS 'Automatically creates/updates user_profiles on auth.users insert. Handles re-invited users with ON CONFLICT.';

-- ============================================================
-- End of handle_new_user fix
-- ============================================================
