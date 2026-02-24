-- ============================================================
-- Equipment Dedicated Table with Permissive RLS
-- Created: 2026-02-24
-- Description: Dedikált equipment tábla a personnel mintájára
-- ============================================================

-- 1. Create equipment table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.equipment (
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

COMMENT ON TABLE equipment IS 'Eszközök dedikált táblája';
COMMENT ON COLUMN equipment.field_values IS 'Dinamikus mezők tárolása JSONB formátumban (EAV helyett)';
COMMENT ON COLUMN equipment.created_by IS 'Létrehozó felhasználó - ownership tracking';

-- 2. Trigger for updated_at
-- ============================================================
CREATE TRIGGER equipment_updated_at
  BEFORE UPDATE ON equipment
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 3. Indexes for performance
-- ============================================================
CREATE INDEX idx_equipment_entity_type ON equipment(entity_type_id);
CREATE INDEX idx_equipment_created_by ON equipment(created_by);
CREATE INDEX idx_equipment_responsible ON equipment(responsible_user_id);
CREATE INDEX idx_equipment_is_active ON equipment(is_active);
CREATE INDEX idx_equipment_field_values ON equipment USING gin(field_values);

-- 4. Enable RLS
-- ============================================================
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies - Permissive Pattern
-- ============================================================

-- SELECT: Everyone can read all equipment
CREATE POLICY "equipment_select_all" ON equipment
  FOR SELECT TO authenticated
  USING (true);

-- INSERT: Admin can insert anything
CREATE POLICY "admin_insert_equipment" ON equipment
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role() = 'admin');

-- INSERT: Reader can insert own (created_by = self)
CREATE POLICY "reader_insert_equipment" ON equipment
  FOR INSERT TO authenticated
  WITH CHECK (
    get_user_role() = 'reader' AND
    created_by = auth.uid()
  );

-- INSERT: User can insert own
CREATE POLICY "user_insert_equipment" ON equipment
  FOR INSERT TO authenticated
  WITH CHECK (
    get_user_role() = 'user' AND
    created_by = auth.uid()
  );

-- UPDATE: Admin can update all
CREATE POLICY "admin_update_equipment" ON equipment
  FOR UPDATE TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- UPDATE: Reader can update own or assigned
CREATE POLICY "reader_update_equipment" ON equipment
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
CREATE POLICY "user_update_equipment" ON equipment
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
CREATE POLICY "admin_delete_equipment" ON equipment
  FOR DELETE TO authenticated
  USING (get_user_role() = 'admin');

-- ============================================================
-- End of Equipment Table Migration
-- ============================================================
