-- ============================================================
-- Equipment Checkouts — Eszköz kölcsönzési nyilvántartás
-- Created: 2026-03-29
-- Description: QR-kóddal vezérelt felvétel/visszavitel + 18:00-ás emlékeztető
-- ============================================================

-- 1. Tábla
-- ============================================================
CREATE TABLE IF NOT EXISTS public.equipment_checkouts (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id            UUID        NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
    user_id                 UUID        NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    checked_out_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    returned_at             TIMESTAMPTZ,                        -- NULL = aktív kölcsönzés
    last_reminder_sent_at   TIMESTAMPTZ,                        -- naponta frissül
    reminder_ack            TEXT        CHECK (reminder_ack IN ('yes', 'no')),
    closed_by_admin         BOOLEAN     NOT NULL DEFAULT false,
    notes                   TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE equipment_checkouts IS 'Eszköz kölcsönzési napló – egy eszközhöz egyszerre csak 1 aktív sor';
COMMENT ON COLUMN equipment_checkouts.returned_at IS 'NULL = aktív kölcsönzés';
COMMENT ON COLUMN equipment_checkouts.last_reminder_sent_at IS '18:00-ás napi emlékeztető utolsó küldési ideje';
COMMENT ON COLUMN equipment_checkouts.reminder_ack IS 'yes = visszavitte (email link), no = még nála van';
COMMENT ON COLUMN equipment_checkouts.closed_by_admin IS 'Admin zárta le a kölcsönzést';

-- 2. Partial unique index: eszközönként max 1 aktív kölcsönzés
-- ============================================================
CREATE UNIQUE INDEX IF NOT EXISTS equipment_checkouts_active_unique
    ON public.equipment_checkouts (equipment_id)
    WHERE returned_at IS NULL;

-- 3. Index a lekérdezési teljesítményhez
-- ============================================================
CREATE INDEX IF NOT EXISTS equipment_checkouts_user_id_idx
    ON public.equipment_checkouts (user_id);

CREATE INDEX IF NOT EXISTS equipment_checkouts_equipment_id_idx
    ON public.equipment_checkouts (equipment_id);

-- 4. RLS engedélyezése
-- ============================================================
ALTER TABLE public.equipment_checkouts ENABLE ROW LEVEL SECURITY;

-- SELECT: minden bejelentkezett user láthatja (ki veszi el az eszközöket)
CREATE POLICY "checkout_select_authenticated"
    ON public.equipment_checkouts
    FOR SELECT
    TO authenticated
    USING (true);

-- INSERT: saját user_id-vel vehet fel bárki
CREATE POLICY "checkout_insert_own"
    ON public.equipment_checkouts
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- UPDATE: csak a kölcsönző user, vagy admin/manager zárhat le bármit
CREATE POLICY "checkout_update_own_or_admin"
    ON public.equipment_checkouts
    FOR UPDATE
    TO authenticated
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid()
              AND role IN ('admin', 'manager')
        )
    );

-- DELETE: csak admin (ritka, de legyen lehetséges hibás felvétel törléséhez)
CREATE POLICY "checkout_delete_admin"
    ON public.equipment_checkouts
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid()
              AND role = 'admin'
        )
    );

-- 5. Cron: naponta 18:00-kor küldi az emlékeztetőket (Europe/Budapest)
-- ============================================================
CREATE OR REPLACE FUNCTION invoke_equipment_checkout_reminder()
RETURNS void AS $$
DECLARE
    project_url TEXT := 'https://mgducjqbzqcmrzcsklmn.supabase.co/functions/v1/equipment-checkout-reminder';
    service_key TEXT := current_setting('app.service_role_key', true);
BEGIN
    PERFORM net.http_post(
        url     := project_url,
        headers := jsonb_build_object(
            'Content-Type',  'application/json',
            'Authorization', 'Bearer ' || service_key
        )
    );
END;
$$ LANGUAGE plpgsql;

-- 16:00 UTC = 18:00 CEST (nyári idő) / 17:00 CET (téli idő)
-- A pontos időpontot a Supabase Dashboard Cron Jobs felületén is be lehet állítani
SELECT cron.schedule(
    'equipment-checkout-reminder-daily',
    '0 16 * * *',
    $$ SELECT invoke_equipment_checkout_reminder() $$
);
