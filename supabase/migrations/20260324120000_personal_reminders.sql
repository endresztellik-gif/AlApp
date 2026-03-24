-- ============================================================
-- Personal Reminders - Személyes Határidő Emlékeztetők
-- Created: 2026-03-24
-- Description: Csak a tulajdonos látja - admin sem! (nincs admin bypass)
-- ============================================================

-- 1. Emlékeztetők tábla
-- ============================================================
CREATE TABLE IF NOT EXISTS public.personal_reminders (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  description TEXT,
  due_at      TIMESTAMPTZ NOT NULL,
  is_done     BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE personal_reminders IS 'Személyes határidő emlékeztetők - kizárólag a tulajdonos látja (nincs admin bypass)';

-- 2. Értesítési időpontok táblája (több per emlékeztető)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.personal_reminder_notifications (
  id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  reminder_id            UUID        NOT NULL REFERENCES personal_reminders(id) ON DELETE CASCADE,
  user_id                UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notify_before_minutes  INTEGER     NOT NULL DEFAULT 0,
  -- trigger_at = due_at - notify_before_minutes * '1 minute' (Edge Function számolja)
  sent_at                TIMESTAMPTZ,   -- NULL = még nem ment ki
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE personal_reminder_notifications IS 'Emlékeztető értesítési időpontok (pl. 1 nappal előtte, 8 órával előtte)';
COMMENT ON COLUMN personal_reminder_notifications.notify_before_minutes IS '0=pontosan, 480=8 óra előtte, 1440=1 nap, 2880=2 nap, 10080=1 hét';

-- 3. Indexek
-- ============================================================
CREATE INDEX idx_personal_reminders_user_id  ON personal_reminders(user_id);
CREATE INDEX idx_personal_reminders_due_at   ON personal_reminders(due_at);
CREATE INDEX idx_personal_reminders_is_done  ON personal_reminders(is_done);

CREATE INDEX idx_prn_reminder_id ON personal_reminder_notifications(reminder_id);
CREATE INDEX idx_prn_user_id     ON personal_reminder_notifications(user_id);
CREATE INDEX idx_prn_sent_at     ON personal_reminder_notifications(sent_at);

-- 4. updated_at trigger
-- ============================================================
CREATE TRIGGER personal_reminders_updated_at
  BEFORE UPDATE ON personal_reminders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 5. RLS engedélyezés
-- ============================================================
ALTER TABLE personal_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_reminder_notifications ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policy-k: CSAK a tulajdonos – NINCS admin bypass!
-- ============================================================
-- Ez szándékosan különbözik minden más táblától (ahol admin mindent lát).
-- Egyetlen policy: bármely authenticated user csak a saját sorait érheti el.

CREATE POLICY "personal_reminders_owner_only"
  ON personal_reminders
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "personal_reminder_notifications_owner_only"
  ON personal_reminder_notifications
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- MEGJEGYZÉS: Az Edge Function (send-reminders) service_role
-- kulccsal fut, ami megkerüli az RLS-t – de kizárólag értesítés
-- küldésre használja az adatot, semmilyen API response-ban nem
-- adja vissza a tartalmát.
-- ============================================================
