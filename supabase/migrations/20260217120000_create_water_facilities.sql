-- Migration file for Water Facilities module
-- Created at: 2026-02-17
-- Description: Creates `water_facilities` table and associated storage buckets/policies.

-- 1. Create `water_facilities` table
CREATE TABLE IF NOT EXISTS public.water_facilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    permit_number TEXT,
    permit_issue_date DATE,
    permit_expiry_date DATE,
    authority TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid()
);

-- 2. Add RLS Policies for `water_facilities`
ALTER TABLE public.water_facilities ENABLE ROW LEVEL SECURITY;

-- Helper function check (assumes get_my_role exists from previous migrations)
-- If not, we might need to recreate it, but it should be there.

-- SELECT: Everyone can view
CREATE POLICY "Allow view for all authenticated" ON public.water_facilities
    FOR SELECT TO authenticated
    USING (true);

-- INSERT: Admin or Manager
CREATE POLICY "Allow insert for admin and manager" ON public.water_facilities
    FOR INSERT TO authenticated
    WITH CHECK (
        get_my_role() IN ('admin', 'manager')
    );

-- UPDATE: Admin or Manager
CREATE POLICY "Allow update for admin and manager" ON public.water_facilities
    FOR UPDATE TO authenticated
    USING (
        get_my_role() IN ('admin', 'manager')
    )
    WITH CHECK (
        get_my_role() IN ('admin', 'manager')
    );

-- DELETE: Admin or Manager
CREATE POLICY "Allow delete for admin and manager" ON public.water_facilities
    FOR DELETE TO authenticated
    USING (
        get_my_role() IN ('admin', 'manager')
    );

-- 3. Create Storage Buckets for Documents and Images
-- Note: Creating buckets via SQL is possible with the storage schema, but sometimes restricted.
-- We will try to insert into storage.buckets.

INSERT INTO storage.buckets (id, name, public)
VALUES ('water_facility_documents', 'water_facility_documents', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('water_facility_images', 'water_facility_images', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Storage Policies

-- Documents: Read (Authenticated), Write (Admin/Manager)
CREATE POLICY "Allow view documents for authenticated" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'water_facility_documents');

CREATE POLICY "Allow upload documents for admin/manager" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'water_facility_documents' 
        AND get_my_role() IN ('admin', 'manager')
    );
    
CREATE POLICY "Allow update documents for admin/manager" ON storage.objects
    FOR UPDATE TO authenticated
    USING (
        bucket_id = 'water_facility_documents' 
        AND get_my_role() IN ('admin', 'manager')
    );

CREATE POLICY "Allow delete documents for admin/manager" ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'water_facility_documents' 
        AND get_my_role() IN ('admin', 'manager')
    );

-- Images: Read (Public/Auth), Write (Admin/Manager)
CREATE POLICY "Allow view images for everyone" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'water_facility_images');

-- Note: If public bucket, unauthenticated access is possible via public URL, but list/select via API requires policy.
-- Since the bucket is public, we might not need a policy for SELECT if accessing via public URL, but good to have for client.

CREATE POLICY "Allow upload images for admin/manager" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'water_facility_images' 
        AND get_my_role() IN ('admin', 'manager')
    );

CREATE POLICY "Allow update images for admin/manager" ON storage.objects
    FOR UPDATE TO authenticated
    USING (
        bucket_id = 'water_facility_images' 
        AND get_my_role() IN ('admin', 'manager')
    );

CREATE POLICY "Allow delete images for admin/manager" ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'water_facility_images' 
        AND get_my_role() IN ('admin', 'manager')
    );

