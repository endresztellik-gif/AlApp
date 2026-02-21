-- ============================================================
-- Fix permissions for non-admins (Editing & Viewing)
-- ============================================================

-- 1. Field Values: Allow full access for authenticated users
--    (Necessary for editing vehicle details like license plate, expiry, etc.)
-- ============================================================
ALTER TABLE public.field_values ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access field_values for authenticated" ON public.field_values;
CREATE POLICY "Allow all access field_values for authenticated" ON public.field_values
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- 2. Entities: Ensure SELECT is allowed for everyone
--    (Necessary for viewing lists and for joins in Incidents view)
-- ============================================================
DROP POLICY IF EXISTS "Allow select entities for authenticated" ON public.entities;
CREATE POLICY "Allow select entities for authenticated" ON public.entities
    FOR SELECT TO authenticated
    USING (true);

-- 3. Incident Photos: Ensure storage objects can be linked
--    (This table was created in the previous step, ensuring policies are correct)
-- ============================================================
-- (No changes needed if previous migration ran, but good to double check via Supabase dashboard if issues persist)
