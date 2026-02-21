-- ============================================================
-- Restrict creation rights for non-admins
-- ============================================================

-- 1. Entities Table: Only admins can INSERT
-- ============================================================
ALTER TABLE public.entities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.entities;
DROP POLICY IF EXISTS "Allow insert entities for authenticated" ON public.entities;

CREATE POLICY "Allow insert entities for admins only" ON public.entities
    FOR INSERT TO authenticated
    WITH CHECK (
        (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
    );

-- Ensure UPDATE is allowed for authenticated users (validity renewal, etc.)
DROP POLICY IF EXISTS "Allow update entities for authenticated" ON public.entities;
CREATE POLICY "Allow update entities for authenticated" ON public.entities
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

-- 2. Incidents Table: Allow INSERT for all authenticated users
-- ============================================================
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow insert incidents for authenticated" ON public.incidents;
CREATE POLICY "Allow insert incidents for authenticated" ON public.incidents
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = reported_by);

DROP POLICY IF EXISTS "Allow view incidents for authenticated" ON public.incidents;
CREATE POLICY "Allow view incidents for authenticated" ON public.incidents
    FOR SELECT TO authenticated
    USING (true);

-- 3. Incident Photos Table: Allow INSERT for all authenticated users
-- ============================================================
CREATE TABLE IF NOT EXISTS public.incident_photos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    incident_id UUID REFERENCES public.incidents(id) ON DELETE CASCADE,
    drive_file_id TEXT,
    drive_url TEXT,
    filename TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.incident_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow insert incident_photos for authenticated" ON public.incident_photos;
CREATE POLICY "Allow insert incident_photos for authenticated" ON public.incident_photos
    FOR INSERT TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow view incident_photos for authenticated" ON public.incident_photos;
CREATE POLICY "Allow view incident_photos for authenticated" ON public.incident_photos
    FOR SELECT TO authenticated
    USING (true);

-- 4. Audit Log: Create Table & Allow INSERT for all authenticated users
-- ============================================================
-- Renamed to 'audit_log' (singular) to match src/modules/admin/hooks/useAuditLogsAdmin.ts
CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id TEXT,
    old_values JSONB,
    new_values JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow insert audit_log for authenticated" ON public.audit_log;
CREATE POLICY "Allow insert audit_log for authenticated" ON public.audit_log
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow select audit_log for admins" ON public.audit_log;
CREATE POLICY "Allow select audit_log for admins" ON public.audit_log
    FOR SELECT TO authenticated
    USING (
        (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
    );
