-- ============================================================
-- Storage Policy Fix
-- Update storage bucket policies: manager → reader
-- ============================================================

-- ============================================================
-- water_facility_documents bucket
-- ============================================================

-- Drop existing policies (if they reference 'manager')
DROP POLICY IF EXISTS "manager_upload_wf_docs" ON storage.objects;
DROP POLICY IF EXISTS "manager_update_wf_docs" ON storage.objects;
DROP POLICY IF EXISTS "manager_delete_wf_docs" ON storage.objects;

-- Everyone can view documents
CREATE POLICY "anyone_view_wf_docs" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'water_facility_documents');

-- Admin and Reader can upload documents
CREATE POLICY "admin_reader_upload_wf_docs" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'water_facility_documents' AND
    (get_user_role() = 'admin' OR get_user_role() = 'reader')
  );

-- Admin and Reader can update documents
CREATE POLICY "admin_reader_update_wf_docs" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'water_facility_documents' AND
    (get_user_role() = 'admin' OR get_user_role() = 'reader')
  );

-- Admin and Reader can delete documents
CREATE POLICY "admin_reader_delete_wf_docs" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'water_facility_documents' AND
    (get_user_role() = 'admin' OR get_user_role() = 'reader')
  );

-- ============================================================
-- water_facility_images bucket
-- ============================================================

-- Drop existing policies (if they reference 'manager')
DROP POLICY IF EXISTS "manager_upload_wf_images" ON storage.objects;
DROP POLICY IF EXISTS "manager_update_wf_images" ON storage.objects;
DROP POLICY IF EXISTS "manager_delete_wf_images" ON storage.objects;

-- Everyone can view images
CREATE POLICY "anyone_view_wf_images" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'water_facility_images');

-- Admin and Reader can upload images
CREATE POLICY "admin_reader_upload_wf_images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'water_facility_images' AND
    (get_user_role() = 'admin' OR get_user_role() = 'reader')
  );

-- Admin and Reader can update images
CREATE POLICY "admin_reader_update_wf_images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'water_facility_images' AND
    (get_user_role() = 'admin' OR get_user_role() = 'reader')
  );

-- Admin and Reader can delete images
CREATE POLICY "admin_reader_delete_wf_images" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'water_facility_images' AND
    (get_user_role() = 'admin' OR get_user_role() = 'reader')
  );
