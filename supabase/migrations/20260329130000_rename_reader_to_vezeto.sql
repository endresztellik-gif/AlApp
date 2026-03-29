-- ============================================================
-- AlApp – reader → vezető szerepkör átnevezés
-- Created: 2026-03-29
-- Description: A 'reader' szerepkör átnevezése 'vezető'-re.
--              Csak névcsere, a jogosultságok tartalma nem változik.
-- ============================================================

-- ============================================================
-- 1. Meglévő 'reader' userek frissítése
-- ============================================================
UPDATE public.user_profiles SET role = 'vezető' WHERE role = 'reader';

-- ============================================================
-- 2. CHECK constraint frissítése user_profiles táblán
-- ============================================================
ALTER TABLE public.user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_role_check;

ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_role_check
    CHECK (role IN ('user', 'vezető', 'admin'));

-- ============================================================
-- 3. user_profiles policies frissítése
-- ============================================================
DROP POLICY IF EXISTS "reader_select_profiles" ON public.user_profiles;

CREATE POLICY "vezeto_select_profiles" ON public.user_profiles
  FOR SELECT TO authenticated
  USING (get_user_role() = 'vezető');

-- ============================================================
-- 4. entities policies frissítése
-- ============================================================
DROP POLICY IF EXISTS "reader_select_entities" ON public.entities;
DROP POLICY IF EXISTS "reader_update_own_entities" ON public.entities;

CREATE POLICY "vezeto_select_entities" ON public.entities
  FOR SELECT TO authenticated
  USING (get_user_role() = 'vezető');

CREATE POLICY "vezeto_update_own_entities" ON public.entities
  FOR UPDATE TO authenticated
  USING (
    get_user_role() = 'vezető' AND (
      responsible_user_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM entity_user_links
        WHERE entity_id = entities.id AND user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    get_user_role() = 'vezető' AND (
      responsible_user_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM entity_user_links
        WHERE entity_id = entities.id AND user_id = auth.uid()
      )
    )
  );

-- ============================================================
-- 5. field_values policies frissítése
-- ============================================================
DROP POLICY IF EXISTS "reader_select_field_values" ON public.field_values;
DROP POLICY IF EXISTS "reader_insert_own_field_values" ON public.field_values;
DROP POLICY IF EXISTS "reader_update_own_field_values" ON public.field_values;

CREATE POLICY "vezeto_select_field_values" ON public.field_values
  FOR SELECT TO authenticated
  USING (get_user_role() = 'vezető');

CREATE POLICY "vezeto_insert_own_field_values" ON public.field_values
  FOR INSERT TO authenticated
  WITH CHECK (
    get_user_role() = 'vezető' AND
    EXISTS (
      SELECT 1 FROM entities e
      LEFT JOIN entity_user_links eul ON eul.entity_id = e.id
      WHERE e.id = field_values.entity_id
      AND (eul.user_id = auth.uid() OR e.responsible_user_id = auth.uid())
    )
  );

CREATE POLICY "vezeto_update_own_field_values" ON public.field_values
  FOR UPDATE TO authenticated
  USING (
    get_user_role() = 'vezető' AND
    EXISTS (
      SELECT 1 FROM entities e
      LEFT JOIN entity_user_links eul ON eul.entity_id = e.id
      WHERE e.id = field_values.entity_id
      AND (eul.user_id = auth.uid() OR e.responsible_user_id = auth.uid())
    )
  );

-- ============================================================
-- 6. photos policies frissítése
-- ============================================================
DROP POLICY IF EXISTS "reader_select_photos" ON public.photos;
DROP POLICY IF EXISTS "reader_insert_own_photos" ON public.photos;

CREATE POLICY "vezeto_select_photos" ON public.photos
  FOR SELECT TO authenticated
  USING (get_user_role() = 'vezető');

CREATE POLICY "vezeto_insert_own_photos" ON public.photos
  FOR INSERT TO authenticated
  WITH CHECK (
    get_user_role() = 'vezető' AND
    uploaded_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM entities e
      LEFT JOIN entity_user_links eul ON eul.entity_id = e.id
      WHERE e.id = photos.entity_id
      AND (eul.user_id = auth.uid() OR e.responsible_user_id = auth.uid())
    )
  );

-- ============================================================
-- 7. incidents policies frissítése
-- ============================================================
DROP POLICY IF EXISTS "reader_select_incidents" ON public.incidents;
DROP POLICY IF EXISTS "reader_insert_incidents" ON public.incidents;

CREATE POLICY "vezeto_select_incidents" ON public.incidents
  FOR SELECT TO authenticated
  USING (get_user_role() = 'vezető');

CREATE POLICY "vezeto_insert_incidents" ON public.incidents
  FOR INSERT TO authenticated
  WITH CHECK (
    get_user_role() = 'vezető' AND
    reported_by = auth.uid()
  );

-- ============================================================
-- 8. water_facilities policies frissítése
-- ============================================================
DROP POLICY IF EXISTS "reader_select_water_facilities" ON public.water_facilities;
DROP POLICY IF EXISTS "reader_insert_water_facilities" ON public.water_facilities;
DROP POLICY IF EXISTS "reader_update_own_water_facilities" ON public.water_facilities;

CREATE POLICY "vezeto_select_water_facilities" ON public.water_facilities
  FOR SELECT TO authenticated
  USING (get_user_role() = 'vezető');

CREATE POLICY "vezeto_insert_water_facilities" ON public.water_facilities
  FOR INSERT TO authenticated
  WITH CHECK (
    get_user_role() = 'vezető' AND
    created_by = auth.uid()
  );

CREATE POLICY "vezeto_update_own_water_facilities" ON public.water_facilities
  FOR UPDATE TO authenticated
  USING (
    get_user_role() = 'vezető' AND
    created_by = auth.uid()
  )
  WITH CHECK (
    get_user_role() = 'vezető' AND
    created_by = auth.uid()
  );

-- ============================================================
-- 9. water_facility_photos policies frissítése
-- ============================================================
DROP POLICY IF EXISTS "reader_select_wf_photos" ON public.water_facility_photos;
DROP POLICY IF EXISTS "reader_insert_own_wf_photos" ON public.water_facility_photos;

CREATE POLICY "vezeto_select_wf_photos" ON public.water_facility_photos
  FOR SELECT TO authenticated
  USING (get_user_role() = 'vezető');

CREATE POLICY "vezeto_insert_own_wf_photos" ON public.water_facility_photos
  FOR INSERT TO authenticated
  WITH CHECK (
    get_user_role() = 'vezető' AND
    EXISTS (
      SELECT 1 FROM water_facilities wf
      WHERE wf.id = water_facility_photos.facility_id
      AND wf.created_by = auth.uid()
    )
  );

-- ============================================================
-- 10. water_facility_documents policies frissítése
-- ============================================================
DROP POLICY IF EXISTS "reader_select_wf_docs" ON public.water_facility_documents;
DROP POLICY IF EXISTS "reader_insert_own_wf_docs" ON public.water_facility_documents;

CREATE POLICY "vezeto_select_wf_docs" ON public.water_facility_documents
  FOR SELECT TO authenticated
  USING (get_user_role() = 'vezető');

CREATE POLICY "vezeto_insert_own_wf_docs" ON public.water_facility_documents
  FOR INSERT TO authenticated
  WITH CHECK (
    get_user_role() = 'vezető' AND
    uploaded_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM water_facilities wf
      WHERE wf.id = water_facility_documents.facility_id
      AND wf.created_by = auth.uid()
    )
  );

-- ============================================================
-- 11. maintenance_logs policies frissítése
-- ============================================================
DROP POLICY IF EXISTS "reader_select_maintenance_logs" ON public.maintenance_logs;
DROP POLICY IF EXISTS "reader_insert_own_maintenance_logs" ON public.maintenance_logs;

CREATE POLICY "vezeto_select_maintenance_logs" ON public.maintenance_logs
  FOR SELECT TO authenticated
  USING (get_user_role() = 'vezető');

CREATE POLICY "vezeto_insert_own_maintenance_logs" ON public.maintenance_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    get_user_role() = 'vezető' AND
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM entities e
      LEFT JOIN entity_user_links eul ON eul.entity_id = e.id
      WHERE e.id = maintenance_logs.entity_id
      AND (eul.user_id = auth.uid() OR e.responsible_user_id = auth.uid())
    )
  );

-- ============================================================
-- 12. vehicle_checklists policies frissítése
-- ============================================================
DROP POLICY IF EXISTS "reader_select_vehicle_checklists" ON public.vehicle_checklists;
DROP POLICY IF EXISTS "reader_insert_own_vehicle_checklists" ON public.vehicle_checklists;

CREATE POLICY "vezeto_select_vehicle_checklists" ON public.vehicle_checklists
  FOR SELECT TO authenticated
  USING (get_user_role() = 'vezető');

CREATE POLICY "vezeto_insert_own_vehicle_checklists" ON public.vehicle_checklists
  FOR INSERT TO authenticated
  WITH CHECK (
    get_user_role() = 'vezető' AND
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM entities e
      LEFT JOIN entity_user_links eul ON eul.entity_id = e.id
      WHERE e.id = vehicle_checklists.vehicle_id
      AND (eul.user_id = auth.uid() OR e.responsible_user_id = auth.uid())
    )
  );

-- ============================================================
-- 13. equipment_checkouts UPDATE policy frissítése
--     (volt: 'manager' → új: 'vezető')
-- ============================================================
DROP POLICY IF EXISTS "checkout_update_own_or_admin" ON public.equipment_checkouts;

CREATE POLICY "checkout_update_own_or_admin" ON public.equipment_checkouts
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'vezető')
    )
  );

-- ============================================================
-- 14. Storage policies frissítése (water_facility buckets)
-- ============================================================
DROP POLICY IF EXISTS "admin_reader_upload_wf_docs" ON storage.objects;
DROP POLICY IF EXISTS "admin_reader_update_wf_docs" ON storage.objects;
DROP POLICY IF EXISTS "admin_reader_delete_wf_docs" ON storage.objects;
DROP POLICY IF EXISTS "admin_reader_upload_wf_images" ON storage.objects;
DROP POLICY IF EXISTS "admin_reader_update_wf_images" ON storage.objects;
DROP POLICY IF EXISTS "admin_reader_delete_wf_images" ON storage.objects;

-- water_facility_documents
CREATE POLICY "admin_vezeto_upload_wf_docs" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'water_facility_documents' AND
    (get_user_role() = 'admin' OR get_user_role() = 'vezető')
  );

CREATE POLICY "admin_vezeto_update_wf_docs" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'water_facility_documents' AND
    (get_user_role() = 'admin' OR get_user_role() = 'vezető')
  );

CREATE POLICY "admin_vezeto_delete_wf_docs" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'water_facility_documents' AND
    (get_user_role() = 'admin' OR get_user_role() = 'vezető')
  );

-- water_facility_images
CREATE POLICY "admin_vezeto_upload_wf_images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'water_facility_images' AND
    (get_user_role() = 'admin' OR get_user_role() = 'vezető')
  );

CREATE POLICY "admin_vezeto_update_wf_images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'water_facility_images' AND
    (get_user_role() = 'admin' OR get_user_role() = 'vezető')
  );

CREATE POLICY "admin_vezeto_delete_wf_images" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'water_facility_images' AND
    (get_user_role() = 'admin' OR get_user_role() = 'vezető')
  );
