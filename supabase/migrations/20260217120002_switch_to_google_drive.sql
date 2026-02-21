-- Migration: Switch Water Facilities storage to Google Drive via link tables
-- Created at: 2026-02-17

-- 1. Create `water_facility_photos` table
CREATE TABLE IF NOT EXISTS public.water_facility_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID NOT NULL REFERENCES public.water_facilities(id) ON DELETE CASCADE,
    drive_file_id TEXT NOT NULL,
    drive_url TEXT NOT NULL,
    filename TEXT NOT NULL,
    uploaded_by UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
    uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create `water_facility_documents` table
CREATE TABLE IF NOT EXISTS public.water_facility_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID NOT NULL REFERENCES public.water_facilities(id) ON DELETE CASCADE,
    drive_file_id TEXT NOT NULL,
    drive_url TEXT NOT NULL,
    filename TEXT NOT NULL,
    uploaded_by UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
    uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE public.water_facility_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_facility_documents ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for Photos

-- SELECT: All authenticated users
CREATE POLICY "Allow view photos for authenticated" ON public.water_facility_photos
    FOR SELECT TO authenticated
    USING (true);

-- INSERT: Admin/Manager
CREATE POLICY "Allow insert photos for admin/manager" ON public.water_facility_photos
    FOR INSERT TO authenticated
    WITH CHECK (
        get_my_role() IN ('admin', 'manager')
    );

-- DELETE: Admin/Manager
CREATE POLICY "Allow delete photos for admin/manager" ON public.water_facility_photos
    FOR DELETE TO authenticated
    USING (
        get_my_role() IN ('admin', 'manager')
    );

-- 5. RLS Policies for Documents

-- SELECT: All authenticated users
CREATE POLICY "Allow view documents for authenticated" ON public.water_facility_documents
    FOR SELECT TO authenticated
    USING (true);

-- INSERT: Admin/Manager
CREATE POLICY "Allow insert documents for admin/manager" ON public.water_facility_documents
    FOR INSERT TO authenticated
    WITH CHECK (
        get_my_role() IN ('admin', 'manager')
    );

-- DELETE: Admin/Manager
CREATE POLICY "Allow delete documents for admin/manager" ON public.water_facility_documents
    FOR DELETE TO authenticated
    USING (
        get_my_role() IN ('admin', 'manager')
    );
