-- ============================================================
-- Personnel User Link + RLS Fix
-- Created: 2026-03-26
-- Description: user_id mező hozzáadása a personnel táblához,
--              és a SELECT/UPDATE RLS politikák javítása:
--              - user role csak saját rekordját látja
--              - reader/admin mindenkit lát
-- ============================================================

-- 1. Új oszlop: user_id (nullable FK → auth.users)
ALTER TABLE personnel
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_personnel_user_id ON personnel(user_id);

COMMENT ON COLUMN personnel.user_id IS 'Összekapcsolt auth fiók – ha a személy regisztrált a rendszerbe';

-- 2. SELECT RLS fix
-- Jelenleg: USING (true) – mindenki lát mindenkit
-- Új: user role csak saját rekordját, reader/admin mindenkit
-- ============================================================

DROP POLICY IF EXISTS "personnel_select_all" ON personnel;

-- Admin: mindent lát
CREATE POLICY "admin_select_personnel" ON personnel
  FOR SELECT TO authenticated
  USING (get_user_role() = 'admin');

-- Reader (csoportvezető/osztályvezető): mindent lát
CREATE POLICY "reader_select_personnel" ON personnel
  FOR SELECT TO authenticated
  USING (get_user_role() = 'reader');

-- User (beosztott): csak a saját rekordját látja (ahol user_id = auth.uid())
CREATE POLICY "user_select_personnel" ON personnel
  FOR SELECT TO authenticated
  USING (
    get_user_role() = 'user' AND
    user_id = auth.uid()
  );

-- 3. UPDATE RLS fix for user role
-- Jelenleg: created_by = auth.uid() – a létrehozó szerkesztheti
-- Új: user_id = auth.uid() – a személy maga szerkesztheti saját adatait
-- ============================================================

DROP POLICY IF EXISTS "user_update_personnel" ON personnel;

CREATE POLICY "user_update_personnel" ON personnel
  FOR UPDATE TO authenticated
  USING (
    get_user_role() = 'user' AND
    user_id = auth.uid()
  )
  WITH CHECK (
    get_user_role() = 'user' AND
    user_id = auth.uid()
  );

-- ============================================================
-- End of Personnel User Link Migration
-- ============================================================
