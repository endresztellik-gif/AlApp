-- ============================================================
-- AlApp – 3-Tier Row Level Security (RLS) Implementation
-- 3 role levels: user, reader, admin
-- Based on: 20260211120001_rls_policies.sql
-- Extended with: reader UPDATE permissions for own data
-- ============================================================

-- ============================================================
-- user_profiles
-- ============================================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_profiles" ON user_profiles
  FOR ALL TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "reader_select_profiles" ON user_profiles
  FOR SELECT TO authenticated
  USING (get_user_role() = 'reader');

CREATE POLICY "user_select_own_profile" ON user_profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "user_update_own_profile" ON user_profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================================
-- feature_flags
-- ============================================================
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone_select_flags" ON feature_flags
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "admin_manage_flags" ON feature_flags
  FOR ALL TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- ============================================================
-- entity_types
-- ============================================================
ALTER TABLE entity_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone_select_entity_types" ON entity_types
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "admin_manage_entity_types" ON entity_types
  FOR ALL TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- ============================================================
-- field_schemas
-- ============================================================
ALTER TABLE field_schemas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone_select_field_schemas" ON field_schemas
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "admin_manage_field_schemas" ON field_schemas
  FOR ALL TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- ============================================================
-- entities
-- ============================================================
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;

-- Admin: full access to all entities
CREATE POLICY "admin_all_entities" ON entities
  FOR ALL TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- Reader: view all entities
CREATE POLICY "reader_select_entities" ON entities
  FOR SELECT TO authenticated
  USING (get_user_role() = 'reader');

-- Reader: update ONLY own entities (NEW!)
CREATE POLICY "reader_update_own_entities" ON entities
  FOR UPDATE TO authenticated
  USING (
    get_user_role() = 'reader' AND (
      responsible_user_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM entity_user_links
        WHERE entity_id = entities.id AND user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    get_user_role() = 'reader' AND (
      responsible_user_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM entity_user_links
        WHERE entity_id = entities.id AND user_id = auth.uid()
      )
    )
  );

-- User: view own entities only
CREATE POLICY "user_select_own_entities" ON entities
  FOR SELECT TO authenticated
  USING (
    get_user_role() = 'user' AND (
      EXISTS (
        SELECT 1 FROM entity_user_links
        WHERE entity_user_links.entity_id = entities.id
        AND entity_user_links.user_id = auth.uid()
      )
      OR responsible_user_id = auth.uid()
    )
  );

-- User: update own entities only
CREATE POLICY "user_update_own_entities" ON entities
  FOR UPDATE TO authenticated
  USING (
    get_user_role() = 'user' AND (
      EXISTS (
        SELECT 1 FROM entity_user_links
        WHERE entity_user_links.entity_id = entities.id
        AND entity_user_links.user_id = auth.uid()
      )
      OR responsible_user_id = auth.uid()
    )
  );

-- ============================================================
-- field_values
-- ============================================================
ALTER TABLE field_values ENABLE ROW LEVEL SECURITY;

-- Admin: full access
CREATE POLICY "admin_all_field_values" ON field_values
  FOR ALL TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- Reader: view all field values
CREATE POLICY "reader_select_field_values" ON field_values
  FOR SELECT TO authenticated
  USING (get_user_role() = 'reader');

-- Reader: insert field values for own entities (NEW!)
CREATE POLICY "reader_insert_own_field_values" ON field_values
  FOR INSERT TO authenticated
  WITH CHECK (
    get_user_role() = 'reader' AND
    EXISTS (
      SELECT 1 FROM entities e
      LEFT JOIN entity_user_links eul ON eul.entity_id = e.id
      WHERE e.id = field_values.entity_id
      AND (eul.user_id = auth.uid() OR e.responsible_user_id = auth.uid())
    )
  );

-- Reader: update field values for own entities (NEW!)
CREATE POLICY "reader_update_own_field_values" ON field_values
  FOR UPDATE TO authenticated
  USING (
    get_user_role() = 'reader' AND
    EXISTS (
      SELECT 1 FROM entities e
      LEFT JOIN entity_user_links eul ON eul.entity_id = e.id
      WHERE e.id = field_values.entity_id
      AND (eul.user_id = auth.uid() OR e.responsible_user_id = auth.uid())
    )
  );

-- User: view own entity field values
CREATE POLICY "user_select_own_field_values" ON field_values
  FOR SELECT TO authenticated
  USING (
    get_user_role() = 'user' AND
    EXISTS (
      SELECT 1 FROM entities e
      LEFT JOIN entity_user_links eul ON eul.entity_id = e.id
      WHERE e.id = field_values.entity_id
      AND (eul.user_id = auth.uid() OR e.responsible_user_id = auth.uid())
    )
  );

-- User: insert field values for own entities
CREATE POLICY "user_upsert_own_field_values" ON field_values
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM entities e
      LEFT JOIN entity_user_links eul ON eul.entity_id = e.id
      WHERE e.id = field_values.entity_id
      AND (eul.user_id = auth.uid() OR e.responsible_user_id = auth.uid())
    )
  );

-- User: update field values for own entities
CREATE POLICY "user_update_own_field_values" ON field_values
  FOR UPDATE TO authenticated
  USING (
    get_user_role() = 'user' AND
    EXISTS (
      SELECT 1 FROM entities e
      LEFT JOIN entity_user_links eul ON eul.entity_id = e.id
      WHERE e.id = field_values.entity_id
      AND (eul.user_id = auth.uid() OR e.responsible_user_id = auth.uid())
    )
  );

-- ============================================================
-- entity_user_links
-- ============================================================
ALTER TABLE entity_user_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_entity_user_links" ON entity_user_links
  FOR ALL TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "anyone_select_entity_user_links" ON entity_user_links
  FOR SELECT TO authenticated
  USING (true);

-- ============================================================
-- photos
-- ============================================================
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- Admin: full access
CREATE POLICY "admin_all_photos" ON photos
  FOR ALL TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- Reader: view all photos
CREATE POLICY "reader_select_photos" ON photos
  FOR SELECT TO authenticated
  USING (get_user_role() = 'reader');

-- Reader: upload photos to own entities (NEW!)
CREATE POLICY "reader_insert_own_photos" ON photos
  FOR INSERT TO authenticated
  WITH CHECK (
    get_user_role() = 'reader' AND
    uploaded_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM entities e
      LEFT JOIN entity_user_links eul ON eul.entity_id = e.id
      WHERE e.id = photos.entity_id
      AND (eul.user_id = auth.uid() OR e.responsible_user_id = auth.uid())
    )
  );

-- User: view own entity photos
CREATE POLICY "user_select_own_photos" ON photos
  FOR SELECT TO authenticated
  USING (
    get_user_role() = 'user' AND
    EXISTS (
      SELECT 1 FROM entities e
      LEFT JOIN entity_user_links eul ON eul.entity_id = e.id
      WHERE e.id = photos.entity_id
      AND (eul.user_id = auth.uid() OR e.responsible_user_id = auth.uid())
    )
  );

-- User: upload photos to own entities
CREATE POLICY "user_insert_own_photos" ON photos
  FOR INSERT TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM entities e
      LEFT JOIN entity_user_links eul ON eul.entity_id = e.id
      WHERE e.id = photos.entity_id
      AND (eul.user_id = auth.uid() OR e.responsible_user_id = auth.uid())
    )
  );

-- ============================================================
-- incidents – Admin/Reader see all, User sees only own
-- ============================================================
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

-- Admin: view all incidents
CREATE POLICY "admin_select_incidents" ON incidents
  FOR SELECT TO authenticated
  USING (get_user_role() = 'admin');

-- Reader: view all incidents
CREATE POLICY "reader_select_incidents" ON incidents
  FOR SELECT TO authenticated
  USING (get_user_role() = 'reader');

-- User: view ONLY own incidents
CREATE POLICY "user_select_own_incidents" ON incidents
  FOR SELECT TO authenticated
  USING (
    get_user_role() = 'user' AND
    reported_by = auth.uid()
  );

-- Reader: can create new incident reports
CREATE POLICY "reader_insert_incidents" ON incidents
  FOR INSERT TO authenticated
  WITH CHECK (
    get_user_role() = 'reader' AND
    reported_by = auth.uid()
  );

-- User: can create new incident reports
CREATE POLICY "user_insert_incidents" ON incidents
  FOR INSERT TO authenticated
  WITH CHECK (reported_by = auth.uid());

-- Admin: can update/delete incidents
CREATE POLICY "admin_manage_incidents" ON incidents
  FOR UPDATE TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "admin_delete_incidents" ON incidents
  FOR DELETE TO authenticated
  USING (get_user_role() = 'admin');

-- ============================================================
-- incident_photos
-- ============================================================
ALTER TABLE incident_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone_select_incident_photos" ON incident_photos
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "anyone_insert_incident_photos" ON incident_photos
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "admin_delete_incident_photos" ON incident_photos
  FOR DELETE TO authenticated
  USING (get_user_role() = 'admin');

-- ============================================================
-- water_facilities
-- ============================================================
ALTER TABLE water_facilities ENABLE ROW LEVEL SECURITY;

-- Admin: full access
CREATE POLICY "admin_all_water_facilities" ON water_facilities
  FOR ALL TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- Reader: view all
CREATE POLICY "reader_select_water_facilities" ON water_facilities
  FOR SELECT TO authenticated
  USING (get_user_role() = 'reader');

-- Reader: insert/update own facilities (created_by = self)
CREATE POLICY "reader_insert_water_facilities" ON water_facilities
  FOR INSERT TO authenticated
  WITH CHECK (
    get_user_role() = 'reader' AND
    created_by = auth.uid()
  );

CREATE POLICY "reader_update_own_water_facilities" ON water_facilities
  FOR UPDATE TO authenticated
  USING (
    get_user_role() = 'reader' AND
    created_by = auth.uid()
  )
  WITH CHECK (
    get_user_role() = 'reader' AND
    created_by = auth.uid()
  );

-- User: view all facilities
CREATE POLICY "user_select_water_facilities" ON water_facilities
  FOR SELECT TO authenticated
  USING (get_user_role() = 'user');

-- User: insert/update own facilities (created_by = self)
CREATE POLICY "user_insert_water_facilities" ON water_facilities
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "user_update_own_water_facilities" ON water_facilities
  FOR UPDATE TO authenticated
  USING (
    get_user_role() = 'user' AND
    created_by = auth.uid()
  )
  WITH CHECK (
    get_user_role() = 'user' AND
    created_by = auth.uid()
  );

-- ============================================================
-- water_facility_photos
-- ============================================================
ALTER TABLE water_facility_photos ENABLE ROW LEVEL SECURITY;

-- Admin: full access
CREATE POLICY "admin_all_wf_photos" ON water_facility_photos
  FOR ALL TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- Reader: view all
CREATE POLICY "reader_select_wf_photos" ON water_facility_photos
  FOR SELECT TO authenticated
  USING (get_user_role() = 'reader');

-- Reader: upload to own facilities
CREATE POLICY "reader_insert_own_wf_photos" ON water_facility_photos
  FOR INSERT TO authenticated
  WITH CHECK (
    get_user_role() = 'reader' AND
    EXISTS (
      SELECT 1 FROM water_facilities wf
      WHERE wf.id = water_facility_photos.facility_id
      AND wf.created_by = auth.uid()
    )
  );

-- User: view all facility photos
CREATE POLICY "user_select_wf_photos" ON water_facility_photos
  FOR SELECT TO authenticated
  USING (get_user_role() = 'user');

-- User: upload to own facilities
CREATE POLICY "user_insert_own_wf_photos" ON water_facility_photos
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM water_facilities wf
      WHERE wf.id = water_facility_photos.facility_id
      AND wf.created_by = auth.uid()
    )
  );

-- ============================================================
-- water_facility_documents
-- ============================================================
ALTER TABLE water_facility_documents ENABLE ROW LEVEL SECURITY;

-- Admin: full access
CREATE POLICY "admin_all_wf_docs" ON water_facility_documents
  FOR ALL TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- Reader: view all
CREATE POLICY "reader_select_wf_docs" ON water_facility_documents
  FOR SELECT TO authenticated
  USING (get_user_role() = 'reader');

-- Reader: upload to own facilities
CREATE POLICY "reader_insert_own_wf_docs" ON water_facility_documents
  FOR INSERT TO authenticated
  WITH CHECK (
    get_user_role() = 'reader' AND
    uploaded_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM water_facilities wf
      WHERE wf.id = water_facility_documents.facility_id
      AND wf.created_by = auth.uid()
    )
  );

-- User: view all facility documents
CREATE POLICY "user_select_wf_docs" ON water_facility_documents
  FOR SELECT TO authenticated
  USING (get_user_role() = 'user');

-- User: upload to own facilities
CREATE POLICY "user_insert_own_wf_docs" ON water_facility_documents
  FOR INSERT TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM water_facilities wf
      WHERE wf.id = water_facility_documents.facility_id
      AND wf.created_by = auth.uid()
    )
  );

-- ============================================================
-- maintenance_logs
-- ============================================================
ALTER TABLE maintenance_logs ENABLE ROW LEVEL SECURITY;

-- Admin: full access
CREATE POLICY "admin_all_maintenance_logs" ON maintenance_logs
  FOR ALL TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- Reader: view all
CREATE POLICY "reader_select_maintenance_logs" ON maintenance_logs
  FOR SELECT TO authenticated
  USING (get_user_role() = 'reader');

-- Reader: create logs for own entities
CREATE POLICY "reader_insert_own_maintenance_logs" ON maintenance_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    get_user_role() = 'reader' AND
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM entities e
      LEFT JOIN entity_user_links eul ON eul.entity_id = e.id
      WHERE e.id = maintenance_logs.entity_id
      AND (eul.user_id = auth.uid() OR e.responsible_user_id = auth.uid())
    )
  );

-- User: view own entity logs
CREATE POLICY "user_select_own_maintenance_logs" ON maintenance_logs
  FOR SELECT TO authenticated
  USING (
    get_user_role() = 'user' AND
    EXISTS (
      SELECT 1 FROM entities e
      LEFT JOIN entity_user_links eul ON eul.entity_id = e.id
      WHERE e.id = maintenance_logs.entity_id
      AND (eul.user_id = auth.uid() OR e.responsible_user_id = auth.uid())
    )
  );

-- User: create logs for own entities
CREATE POLICY "user_insert_own_maintenance_logs" ON maintenance_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM entities e
      LEFT JOIN entity_user_links eul ON eul.entity_id = e.id
      WHERE e.id = maintenance_logs.entity_id
      AND (eul.user_id = auth.uid() OR e.responsible_user_id = auth.uid())
    )
  );

-- ============================================================
-- vehicle_checklists
-- ============================================================
ALTER TABLE vehicle_checklists ENABLE ROW LEVEL SECURITY;

-- Admin: full access
CREATE POLICY "admin_all_vehicle_checklists" ON vehicle_checklists
  FOR ALL TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- Reader: view all
CREATE POLICY "reader_select_vehicle_checklists" ON vehicle_checklists
  FOR SELECT TO authenticated
  USING (get_user_role() = 'reader');

-- Reader: create checklists for own vehicles
CREATE POLICY "reader_insert_own_vehicle_checklists" ON vehicle_checklists
  FOR INSERT TO authenticated
  WITH CHECK (
    get_user_role() = 'reader' AND
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM entities e
      LEFT JOIN entity_user_links eul ON eul.entity_id = e.id
      WHERE e.id = vehicle_checklists.vehicle_id
      AND (eul.user_id = auth.uid() OR e.responsible_user_id = auth.uid())
    )
  );

-- User: view own vehicle checklists
CREATE POLICY "user_select_own_vehicle_checklists" ON vehicle_checklists
  FOR SELECT TO authenticated
  USING (
    get_user_role() = 'user' AND
    EXISTS (
      SELECT 1 FROM entities e
      LEFT JOIN entity_user_links eul ON eul.entity_id = e.id
      WHERE e.id = vehicle_checklists.vehicle_id
      AND (eul.user_id = auth.uid() OR e.responsible_user_id = auth.uid())
    )
  );

-- User: create checklists for own vehicles
CREATE POLICY "user_insert_own_vehicle_checklists" ON vehicle_checklists
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM entities e
      LEFT JOIN entity_user_links eul ON eul.entity_id = e.id
      WHERE e.id = vehicle_checklists.vehicle_id
      AND (eul.user_id = auth.uid() OR e.responsible_user_id = auth.uid())
    )
  );

-- ============================================================
-- notification_log
-- ============================================================
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_notification_log" ON notification_log
  FOR ALL TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "user_select_own_notifications" ON notification_log
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "user_ack_own_notifications" ON notification_log
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- push_subscriptions
-- ============================================================
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_manage_own_push" ON push_subscriptions
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- audit_log – Admin can read, anyone can write
-- ============================================================
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_select_audit_log" ON audit_log
  FOR SELECT TO authenticated
  USING (get_user_role() = 'admin');

CREATE POLICY "anyone_insert_audit_log" ON audit_log
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- ============================================================
-- app_settings
-- ============================================================
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone_select_app_settings" ON app_settings
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "admin_manage_app_settings" ON app_settings
  FOR ALL TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');
