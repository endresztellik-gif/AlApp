-- ============================================================
-- Personnel Dedicated Table with Permissive RLS
-- Created: 2026-02-24
-- Description: Dedikált personnel tábla a water_facilities mintájára,
--              de permissive RLS-sel (reader/user is tud CREATE-elni)
-- ============================================================

-- 1. Create personnel table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.personnel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type_id UUID NOT NULL REFERENCES entity_types(id) ON DELETE RESTRICT,
  display_name TEXT NOT NULL,
  responsible_user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
  field_values JSONB DEFAULT '{}'::jsonb, -- Dynamic fields stored as JSON
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE personnel IS 'Személyek dedikált táblája (kollégák, stb.)';
COMMENT ON COLUMN personnel.field_values IS 'Dinamikus mezők tárolása JSONB formátumban (EAV helyett)';
COMMENT ON COLUMN personnel.created_by IS 'Létrehozó felhasználó - ownership tracking';

-- 2. Trigger for updated_at
-- ============================================================
CREATE TRIGGER personnel_updated_at
  BEFORE UPDATE ON personnel
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 3. Indexes for performance
-- ============================================================
CREATE INDEX idx_personnel_entity_type ON personnel(entity_type_id);
CREATE INDEX idx_personnel_created_by ON personnel(created_by);
CREATE INDEX idx_personnel_responsible ON personnel(responsible_user_id);
CREATE INDEX idx_personnel_is_active ON personnel(is_active);
CREATE INDEX idx_personnel_field_values ON personnel USING gin(field_values);

-- 4. Enable RLS
-- ============================================================
ALTER TABLE personnel ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies - Permissive Pattern
-- ============================================================

-- SELECT: Everyone can read all personnel
CREATE POLICY "personnel_select_all" ON personnel
  FOR SELECT TO authenticated
  USING (true);

-- INSERT: Admin can insert anything
CREATE POLICY "admin_insert_personnel" ON personnel
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role() = 'admin');

-- INSERT: Reader can insert own (created_by = self)
CREATE POLICY "reader_insert_personnel" ON personnel
  FOR INSERT TO authenticated
  WITH CHECK (
    get_user_role() = 'reader' AND
    created_by = auth.uid()
  );

-- INSERT: User can insert own
CREATE POLICY "user_insert_personnel" ON personnel
  FOR INSERT TO authenticated
  WITH CHECK (
    get_user_role() = 'user' AND
    created_by = auth.uid()
  );

-- UPDATE: Admin can update all
CREATE POLICY "admin_update_personnel" ON personnel
  FOR UPDATE TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- UPDATE: Reader can update own or assigned
CREATE POLICY "reader_update_personnel" ON personnel
  FOR UPDATE TO authenticated
  USING (
    get_user_role() = 'reader' AND (
      created_by = auth.uid() OR
      responsible_user_id = auth.uid()
    )
  )
  WITH CHECK (
    get_user_role() = 'reader' AND (
      created_by = auth.uid() OR
      responsible_user_id = auth.uid()
    )
  );

-- UPDATE: User can update own
CREATE POLICY "user_update_personnel" ON personnel
  FOR UPDATE TO authenticated
  USING (
    get_user_role() = 'user' AND
    created_by = auth.uid()
  )
  WITH CHECK (
    get_user_role() = 'user' AND
    created_by = auth.uid()
  );

-- DELETE: Only admin
CREATE POLICY "admin_delete_personnel" ON personnel
  FOR DELETE TO authenticated
  USING (get_user_role() = 'admin');

-- ============================================================
-- End of Personnel Table Migration
-- ============================================================
