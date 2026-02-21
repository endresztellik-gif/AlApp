-- ============================================================
-- Force Cleanup of RLS Policies to resolve conflicts
-- ============================================================

-- 1. CLEANUP: Field Values
-- Drop ALL known policies to ensure a clean slate
-- ============================================================
ALTER TABLE public.field_values ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_field_values" ON public.field_values;
DROP POLICY IF EXISTS "reader_select_field_values" ON public.field_values;
DROP POLICY IF EXISTS "user_select_own_field_values" ON public.field_values;
DROP POLICY IF EXISTS "user_upsert_own_field_values" ON public.field_values;
DROP POLICY IF EXISTS "user_update_own_field_values" ON public.field_values;
DROP POLICY IF EXISTS "Allow all access field_values for authenticated" ON public.field_values;

-- Re-apply Permissive Policy for Field Values (Editing Support)
CREATE POLICY "Allow all access field_values for authenticated" ON public.field_values
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- 2. CLEANUP: Incidents
-- Drop ALL known policies
-- ============================================================
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone_insert_incidents" ON public.incidents;
DROP POLICY IF EXISTS "anyone_select_incidents" ON public.incidents;
DROP POLICY IF EXISTS "admin_manage_incidents" ON public.incidents;
DROP POLICY IF EXISTS "admin_delete_incidents" ON public.incidents;
DROP POLICY IF EXISTS "Allow insert incidents for authenticated" ON public.incidents;
DROP POLICY IF EXISTS "Allow view incidents for authenticated" ON public.incidents;

-- Re-apply Permissive Policies for Incidents (Reporting & Viewing)
CREATE POLICY "Allow insert incidents for authenticated" ON public.incidents
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = reported_by);

CREATE POLICY "Allow view incidents for authenticated" ON public.incidents
    FOR SELECT TO authenticated
    USING (true);

-- 3. CLEANUP: Entities
-- Drop ALL known policies
-- ============================================================
ALTER TABLE public.entities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_entities" ON public.entities;
DROP POLICY IF EXISTS "reader_select_entities" ON public.entities;
DROP POLICY IF EXISTS "user_select_own_entities" ON public.entities;
DROP POLICY IF EXISTS "user_update_own_entities" ON public.entities;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.entities;
DROP POLICY IF EXISTS "Allow insert entities for authenticated" ON public.entities;
DROP POLICY IF EXISTS "Allow insert entities for admins only" ON public.entities;
DROP POLICY IF EXISTS "Allow update entities for authenticated" ON public.entities;
DROP POLICY IF EXISTS "Allow select entities for authenticated" ON public.entities;

-- Re-apply Correct Policies for Entities
-- INSERT: Admins only
CREATE POLICY "Allow insert entities for admins only" ON public.entities
    FOR INSERT TO authenticated
    WITH CHECK (
        (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
    );

-- UPDATE: All authenticated (for validity etc)
CREATE POLICY "Allow update entities for authenticated" ON public.entities
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

-- SELECT: All authenticated (for viewing lists)
CREATE POLICY "Allow select entities for authenticated" ON public.entities
    FOR SELECT TO authenticated
    USING (true);

-- 4. CLEANUP: Incident Photos
-- Just ensure they are open
-- ============================================================
ALTER TABLE public.incident_photos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anyone_select_incident_photos" ON public.incident_photos;
DROP POLICY IF EXISTS "anyone_insert_incident_photos" ON public.incident_photos;
DROP POLICY IF EXISTS "admin_delete_incident_photos" ON public.incident_photos;
DROP POLICY IF EXISTS "Allow insert incident_photos for authenticated" ON public.incident_photos;
DROP POLICY IF EXISTS "Allow view incident_photos for authenticated" ON public.incident_photos;

CREATE POLICY "Allow insert incident_photos for authenticated" ON public.incident_photos
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow view incident_photos for authenticated" ON public.incident_photos
    FOR SELECT TO authenticated
    USING (true);
