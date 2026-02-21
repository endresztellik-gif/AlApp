-- ============================================================
-- AlApp – Row Level Security (RLS) szabályok
-- 3 szintű jogosultsági modell: user, reader, admin
-- ============================================================

-- Segédfüggvény: aktuális felhasználó szerepkörének lekérdezése
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.user_profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

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

-- Admin: mindent lát és szerkeszt
CREATE POLICY "admin_all_entities" ON entities
  FOR ALL TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- Olvasó: mindent lát (csak SELECT)
CREATE POLICY "reader_select_entities" ON entities
  FOR SELECT TO authenticated
  USING (get_user_role() = 'reader');

-- Felhasználó: saját entitásait látja
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

-- Felhasználó: saját entitásait szerkeszti
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

CREATE POLICY "admin_all_field_values" ON field_values
  FOR ALL TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "reader_select_field_values" ON field_values
  FOR SELECT TO authenticated
  USING (get_user_role() = 'reader');

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

CREATE POLICY "admin_all_photos" ON photos
  FOR ALL TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "reader_select_photos" ON photos
  FOR SELECT TO authenticated
  USING (get_user_role() = 'reader');

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
-- incidents – Bárki felvihet, mindenki lát, admin kezel
-- ============================================================
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone_insert_incidents" ON incidents
  FOR INSERT TO authenticated
  WITH CHECK (reported_by = auth.uid());

CREATE POLICY "anyone_select_incidents" ON incidents
  FOR SELECT TO authenticated
  USING (true);

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
-- audit_log – Csak admin olvashat, bárki írhat
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
