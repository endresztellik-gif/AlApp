-- ============================================================
-- Fix: personnel.intended_role CHECK constraint + vezető RLS
-- Created: 2026-03-29
-- Description:
--   1. intended_role CHECK constraint: 'reader' → 'vezető'
--   2. reader_select_personnel → vezeto_select_personnel
--   3. reader_insert_personnel → vezeto_insert_personnel
--   4. reader_update_personnel → vezeto_update_personnel
-- ============================================================

-- 1. intended_role CHECK constraint javítása
-- ============================================================
ALTER TABLE personnel
  DROP CONSTRAINT IF EXISTS personnel_intended_role_check;

ALTER TABLE personnel
  ADD CONSTRAINT personnel_intended_role_check
    CHECK (intended_role IN ('user', 'vezető', 'admin'));

-- Meglévő 'reader' értékek frissítése (ha volna ilyen adat)
UPDATE personnel SET intended_role = 'vezető' WHERE intended_role = 'reader';

-- 2. SELECT policy: reader → vezető
-- ============================================================
DROP POLICY IF EXISTS "reader_select_personnel" ON personnel;

CREATE POLICY "vezeto_select_personnel" ON personnel
  FOR SELECT TO authenticated
  USING (get_user_role() = 'vezető');

-- 3. INSERT policy: reader → vezető
-- ============================================================
DROP POLICY IF EXISTS "reader_insert_personnel" ON personnel;

CREATE POLICY "vezeto_insert_personnel" ON personnel
  FOR INSERT TO authenticated
  WITH CHECK (
    get_user_role() = 'vezető' AND
    created_by = auth.uid()
  );

-- 4. UPDATE policy: reader → vezető
-- ============================================================
DROP POLICY IF EXISTS "reader_update_personnel" ON personnel;

CREATE POLICY "vezeto_update_personnel" ON personnel
  FOR UPDATE TO authenticated
  USING (
    get_user_role() = 'vezető' AND (
      created_by = auth.uid() OR
      responsible_user_id = auth.uid()
    )
  )
  WITH CHECK (
    get_user_role() = 'vezető' AND (
      created_by = auth.uid() OR
      responsible_user_id = auth.uid()
    )
  );

-- ============================================================
-- End
-- ============================================================
