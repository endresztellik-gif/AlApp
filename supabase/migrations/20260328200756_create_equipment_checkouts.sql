
-- Equipment checkout/return tracking
CREATE TABLE equipment_checkouts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id          UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  user_id               UUID NOT NULL REFERENCES user_profiles(id) ON DELETE RESTRICT,
  checked_out_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  returned_at           TIMESTAMPTZ,
  last_reminder_sent_at TIMESTAMPTZ,
  reminder_ack          TEXT CHECK (reminder_ack IN ('yes', 'no')),
  notes                 TEXT,
  closed_by_admin       BOOLEAN NOT NULL DEFAULT FALSE
);

-- Csak 1 aktív kölcsönzés lehet egyszerre egy eszközhöz
CREATE UNIQUE INDEX equipment_checkouts_active_unique
  ON equipment_checkouts (equipment_id)
  WHERE returned_at IS NULL;

-- Gyors lekérdezés: aktív kölcsönzések
CREATE INDEX equipment_checkouts_active_idx
  ON equipment_checkouts (equipment_id, returned_at)
  WHERE returned_at IS NULL;

-- RLS engedélyezése
ALTER TABLE equipment_checkouts ENABLE ROW LEVEL SECURITY;

-- SELECT: minden bejelentkezett felhasználó láthatja (ki van kinél)
CREATE POLICY "checkout_select_authenticated"
  ON equipment_checkouts FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: bejelentkezett user csak saját nevére vehet fel
CREATE POLICY "checkout_insert_own"
  ON equipment_checkouts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- UPDATE: saját kölcsönzést lezárhat, vagy admin bármit
CREATE POLICY "checkout_update_own_or_admin"
  ON equipment_checkouts FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- DELETE: csak admin
CREATE POLICY "checkout_delete_admin"
  ON equipment_checkouts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );
