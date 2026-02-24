-- ============================================================
-- Vehicles Dedicated Table with Permissive RLS
-- Created: 2026-02-24
-- Description: Dedikált vehicles tábla a personnel mintájára
-- ============================================================

-- 1. Create vehicles table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.vehicles (
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

COMMENT ON TABLE vehicles IS 'Járművek dedikált táblája';
COMMENT ON COLUMN vehicles.field_values IS 'Dinamikus mezők tárolása JSONB formátumban (EAV helyett)';
COMMENT ON COLUMN vehicles.created_by IS 'Létrehozó felhasználó - ownership tracking';

-- 2. Trigger for updated_at
-- ============================================================
CREATE TRIGGER vehicles_updated_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 3. Indexes for performance
-- ============================================================
CREATE INDEX idx_vehicles_entity_type ON vehicles(entity_type_id);
CREATE INDEX idx_vehicles_created_by ON vehicles(created_by);
CREATE INDEX idx_vehicles_responsible ON vehicles(responsible_user_id);
CREATE INDEX idx_vehicles_is_active ON vehicles(is_active);
CREATE INDEX idx_vehicles_field_values ON vehicles USING gin(field_values);

-- 4. Enable RLS
-- ============================================================
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies - Permissive Pattern
-- ============================================================

-- SELECT: Everyone can read all vehicles
CREATE POLICY "vehicles_select_all" ON vehicles
  FOR SELECT TO authenticated
  USING (true);

-- INSERT: Admin can insert anything
CREATE POLICY "admin_insert_vehicles" ON vehicles
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role() = 'admin');

-- INSERT: Reader can insert own (created_by = self)
CREATE POLICY "reader_insert_vehicles" ON vehicles
  FOR INSERT TO authenticated
  WITH CHECK (
    get_user_role() = 'reader' AND
    created_by = auth.uid()
  );

-- INSERT: User can insert own
CREATE POLICY "user_insert_vehicles" ON vehicles
  FOR INSERT TO authenticated
  WITH CHECK (
    get_user_role() = 'user' AND
    created_by = auth.uid()
  );

-- UPDATE: Admin can update all
CREATE POLICY "admin_update_vehicles" ON vehicles
  FOR UPDATE TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- UPDATE: Reader can update own or assigned
CREATE POLICY "reader_update_vehicles" ON vehicles
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
CREATE POLICY "user_update_vehicles" ON vehicles
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
CREATE POLICY "admin_delete_vehicles" ON vehicles
  FOR DELETE TO authenticated
  USING (get_user_role() = 'admin');

-- ============================================================
-- End of Vehicles Table Migration
-- ============================================================
