-- ============================================================
-- NUCLEAR FIX: Dynamically drop ALL policies and Reset Permissions
-- ============================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    -- 1. Field Values: Drop all policies dynamically
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'field_values' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON "public"."field_values"';
    END LOOP;

    -- 2. Incidents: Drop all policies dynamically
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'incidents' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON "public"."incidents"';
    END LOOP;

    -- 3. Entities: Drop all policies dynamically
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'entities' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON "public"."entities"';
    END LOOP;

    -- 4. Audit Log: Drop all policies dynamically
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'audit_log' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON "public"."audit_log"';
    END LOOP;
END $$;

-- ============================================================
-- Re-apply Correct Policies
-- ============================================================

-- 1. Field Values (Allow ALL)
ALTER TABLE public.field_values ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.field_values TO authenticated;

CREATE POLICY "final_allow_all_field_values" ON public.field_values
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- 2. Incidents (Allow ALL for now to fix visibility)
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.incidents TO authenticated;

CREATE POLICY "final_allow_all_incidents" ON public.incidents
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- 3. Entities (Admin Create, Others Update/View)
ALTER TABLE public.entities ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.entities TO authenticated;

-- INSERT: Admins only
CREATE POLICY "final_entities_insert_admin" ON public.entities
    FOR INSERT TO authenticated
    WITH CHECK (
        (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
    );

-- UPDATE: All (for validity)
CREATE POLICY "final_entities_update_all" ON public.entities
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

-- SELECT: All
CREATE POLICY "final_entities_select_all" ON public.entities
    FOR SELECT TO authenticated
    USING (true);

-- 4. Audit Log (Everyone Insert, Admin Select)
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.audit_log TO authenticated;

CREATE POLICY "final_audit_log_insert_all" ON public.audit_log
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "final_audit_log_select_admin" ON public.audit_log
    FOR SELECT TO authenticated
    USING (
        (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
    );
