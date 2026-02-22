-- ============================================================
-- Role Function Consolidation
-- Remove redundant get_my_role(), keep optimized get_user_role()
-- ============================================================

-- Drop the PL/pgSQL version (less performant)
-- CASCADE will drop dependent policies (which will be recreated by later migrations)
DROP FUNCTION IF EXISTS public.get_my_role() CASCADE;

-- Ensure the SQL version exists and is properly defined
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.user_profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;
