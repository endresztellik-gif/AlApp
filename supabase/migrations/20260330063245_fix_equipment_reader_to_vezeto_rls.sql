-- Fix: equipment reader_* → vezeto_* RLS policies

DROP POLICY IF EXISTS "reader_insert_equipment" ON equipment;
DROP POLICY IF EXISTS "reader_update_equipment" ON equipment;

CREATE POLICY "vezeto_insert_equipment" ON equipment
  FOR INSERT TO authenticated
  WITH CHECK (
    get_user_role() = 'vezető' AND
    created_by = auth.uid()
  );

CREATE POLICY "vezeto_update_equipment" ON equipment
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
