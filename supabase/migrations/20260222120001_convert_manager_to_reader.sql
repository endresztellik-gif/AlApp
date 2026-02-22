-- ============================================================
-- Data Migration: manager → reader
-- Convert all 'manager' role users to 'reader' role
-- ============================================================

UPDATE public.user_profiles
SET role = 'reader', updated_at = now()
WHERE role = 'manager';
