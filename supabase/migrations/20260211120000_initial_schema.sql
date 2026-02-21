-- ============================================================
-- AlApp – Kezdeti adatbázis séma
-- 14 tábla: user_profiles, feature_flags, entity_types,
-- field_schemas, entities, field_values, entity_user_links,
-- photos, incidents, incident_photos, notification_log,
-- push_subscriptions, audit_log, app_settings
-- ============================================================

-- 0. Segédfüggvények
-- ============================================================

-- updated_at automatikus frissítése
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Automatikus profil létrehozás új Supabase Auth felhasználónál
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Felhasználói profilok
-- ============================================================

CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'reader', 'admin')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);

COMMENT ON TABLE user_profiles IS 'Felhasználói profilok – Supabase Auth kiegészítése szerepkörrel';

-- 2. Feature flagek
-- ============================================================

CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  enabled BOOLEAN DEFAULT false,
  description TEXT,
  updated_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER feature_flags_updated_at
  BEFORE UPDATE ON feature_flags
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE feature_flags IS 'Modulok és funkciók be/kikapcsolása';

-- 3. Entitás típusok
-- ============================================================

CREATE TABLE entity_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  module TEXT NOT NULL CHECK (module IN ('personnel', 'vehicles', 'equipment')),
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_entity_types_module ON entity_types(module);

COMMENT ON TABLE entity_types IS 'Entitás típusok (pl. személyautó, utánfutó, láncfűrész)';

-- 4. Mező sémák (dinamikus mező definíciók)
-- ============================================================

CREATE TABLE field_schemas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type_id UUID NOT NULL REFERENCES entity_types(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  field_key TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN (
    'text', 'number', 'date', 'date_expiry', 'select', 'file'
  )),
  is_required BOOLEAN DEFAULT false,
  select_options JSONB,
  display_order INTEGER DEFAULT 0,
  alert_days_warning INTEGER DEFAULT 90,
  alert_days_urgent INTEGER DEFAULT 30,
  alert_days_critical INTEGER DEFAULT 7,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(entity_type_id, field_key)
);

CREATE INDEX idx_field_schemas_entity_type ON field_schemas(entity_type_id);
CREATE INDEX idx_field_schemas_field_type ON field_schemas(field_type);

COMMENT ON TABLE field_schemas IS 'Dinamikus mező definíciók entitás típusonként';

-- 5. Entitások
-- ============================================================

CREATE TABLE entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type_id UUID NOT NULL REFERENCES entity_types(id),
  display_name TEXT NOT NULL,
  responsible_user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  module TEXT NOT NULL CHECK (module IN ('personnel', 'vehicles', 'equipment')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER entities_updated_at
  BEFORE UPDATE ON entities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_entities_module ON entities(module);
CREATE INDEX idx_entities_entity_type ON entities(entity_type_id);
CREATE INDEX idx_entities_responsible ON entities(responsible_user_id);
CREATE INDEX idx_entities_is_active ON entities(is_active);

COMMENT ON TABLE entities IS 'Konkrét entitások (személyek, járművek, eszközök)';

-- 6. Mező értékek (EAV minta)
-- ============================================================

CREATE TABLE field_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  field_schema_id UUID NOT NULL REFERENCES field_schemas(id) ON DELETE CASCADE,
  value_text TEXT,
  value_date DATE,
  value_json JSONB,
  updated_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(entity_id, field_schema_id)
);

CREATE TRIGGER field_values_updated_at
  BEFORE UPDATE ON field_values
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_field_values_entity ON field_values(entity_id);
CREATE INDEX idx_field_values_schema ON field_values(field_schema_id);
CREATE INDEX idx_field_values_date ON field_values(value_date) WHERE value_date IS NOT NULL;

COMMENT ON TABLE field_values IS 'Dinamikus mező értékek (EAV minta)';

-- 7. Entitás–felhasználó összerendelés
-- ============================================================

CREATE TABLE entity_user_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  UNIQUE(entity_id, user_id)
);

CREATE INDEX idx_entity_user_links_user ON entity_user_links(user_id);
CREATE INDEX idx_entity_user_links_entity ON entity_user_links(entity_id);

COMMENT ON TABLE entity_user_links IS 'Melyik entitás tartozik melyik felhasználóhoz';

-- 8. Fotók (Google Drive referenciák)
-- ============================================================

CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  drive_file_id TEXT NOT NULL,
  drive_url TEXT NOT NULL,
  filename TEXT NOT NULL,
  description TEXT,
  uploaded_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_photos_entity ON photos(entity_id);

COMMENT ON TABLE photos IS 'Fotók Google Drive referenciái';

-- 9. Káresemények
-- ============================================================

CREATE TABLE incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  reported_by UUID NOT NULL REFERENCES user_profiles(id),
  description TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER incidents_updated_at
  BEFORE UPDATE ON incidents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_incidents_entity ON incidents(entity_id);
CREATE INDEX idx_incidents_reported_by ON incidents(reported_by);
CREATE INDEX idx_incidents_status ON incidents(status);

COMMENT ON TABLE incidents IS 'Káresemény bejelentések';

-- 10. Káresemény fotók
-- ============================================================

CREATE TABLE incident_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  drive_file_id TEXT NOT NULL,
  drive_url TEXT NOT NULL,
  filename TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_incident_photos_incident ON incident_photos(incident_id);

COMMENT ON TABLE incident_photos IS 'Káresemény fotók Google Drive referenciái';

-- 11. Értesítési napló
-- ============================================================

CREATE TABLE notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  entity_id UUID REFERENCES entities(id) ON DELETE SET NULL,
  field_schema_id UUID REFERENCES field_schemas(id) ON DELETE SET NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('email', 'push')),
  alert_level TEXT NOT NULL CHECK (alert_level IN ('warning', 'urgent', 'critical', 'expired')),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledged BOOLEAN DEFAULT false
);

CREATE INDEX idx_notification_log_user ON notification_log(user_id);
CREATE INDEX idx_notification_log_sent_at ON notification_log(sent_at);

COMMENT ON TABLE notification_log IS 'Kiküldött értesítések naplója';

-- 12. Push subscription-ök
-- ============================================================

CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_push_subscriptions_user ON push_subscriptions(user_id);

COMMENT ON TABLE push_subscriptions IS 'Web Push feliratkozások (VAPID)';

-- 13. Audit log
-- ============================================================

CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'login', 'logout', 'export')),
  table_name TEXT NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_table ON audit_log(table_name);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);

COMMENT ON TABLE audit_log IS 'Minden CRUD művelet naplózása';

-- 14. App beállítások
-- ============================================================

CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER app_settings_updated_at
  BEFORE UPDATE ON app_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE app_settings IS 'Rendszerszintű beállítások (kulcs-érték párok)';
