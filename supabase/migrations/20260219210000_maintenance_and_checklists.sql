-- ============================================================
-- Phase 2: Maintenance Logs & Vehicle Checklists
-- ============================================================

-- 1. Create Maintenance Logs Table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.maintenance_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    entity_id UUID NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    type TEXT NOT NULL CHECK (type IN ('vizsga', 'szerviz', 'javitas', 'egyreszt')),
    date TIMESTAMPTZ NOT NULL DEFAULT now(),
    description TEXT NOT NULL,
    cost NUMERIC,
    new_validity_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for Maintenance Logs
ALTER TABLE public.maintenance_logs ENABLE ROW LEVEL SECURITY;

-- Everyone can read logs
CREATE POLICY "Allow select maintenance_logs for authenticated" ON public.maintenance_logs
    FOR SELECT TO authenticated
    USING (true);

-- Authenticated users can insert logs
CREATE POLICY "Allow insert maintenance_logs for authenticated" ON public.maintenance_logs
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Only admins can update/delete logs
CREATE POLICY "Allow update maintenance_logs for admin" ON public.maintenance_logs
    FOR UPDATE TO authenticated
    USING ((SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin')
    WITH CHECK (true);

CREATE POLICY "Allow delete maintenance_logs for admin" ON public.maintenance_logs
    FOR DELETE TO authenticated
    USING ((SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin');


-- 2. Create Vehicle Checklists Table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.vehicle_checklists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vehicle_id UUID NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    check_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    oil_ok BOOLEAN NOT NULL,
    coolant_ok BOOLEAN NOT NULL,
    lights_ok BOOLEAN NOT NULL,
    bodywork_ok BOOLEAN NOT NULL,
    bodywork_issue_description TEXT,
    photo_url TEXT,
    is_synced BOOLEAN DEFAULT true, -- For PWA offline sync handling later
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for Vehicle Checklists
ALTER TABLE public.vehicle_checklists ENABLE ROW LEVEL SECURITY;

-- Everyone can read checklists
CREATE POLICY "Allow select vehicle_checklists for authenticated" ON public.vehicle_checklists
    FOR SELECT TO authenticated
    USING (true);

-- Authenticated users can insert checklists
CREATE POLICY "Allow insert vehicle_checklists for authenticated" ON public.vehicle_checklists
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);


-- 3. Auto-update field_values Trigger
-- ============================================================
-- When a maintenance log with type 'vizsga' (inspection) and a new_validity_date is inserted,
-- automatically update the corresponding 'inspection_expiry' in field_values.

CREATE OR REPLACE FUNCTION update_vehicle_inspection_expiry()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update if it's an inspection and a new date is provided
    IF NEW.type = 'vizsga' AND NEW.new_validity_date IS NOT NULL THEN
        -- Check if the field exists, update if yes, insert if no
        IF EXISTS (SELECT 1 FROM public.field_values WHERE entity_id = NEW.entity_id AND (field_schema_id IN (SELECT id FROM field_schemas WHERE field_key = 'inspection_expiry') OR (field_schema_id IS NULL))) THEN
            -- In our current structure, we don't strictly enforce schema_id for generic updates, 
            -- but we need to update the row that implies inspection_expiry.
            -- Actually, to avoid complexity with field_schemas, we can just upsert by entity_id conceptually.
            -- However, AlApp field_values usually link to a schema.
            -- Since we don't have the exact schema ID easy here, we will do a targeted update based on field_schemas lookup.
            
            UPDATE public.field_values fv
            SET value_date = NEW.new_validity_date
            FROM public.field_schemas fs
            WHERE fv.entity_id = NEW.entity_id 
              AND fv.field_schema_id = fs.id 
              AND fs.field_key = 'inspection_expiry';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_inspection_expiry ON public.maintenance_logs;
CREATE TRIGGER trigger_update_inspection_expiry
AFTER INSERT ON public.maintenance_logs
FOR EACH ROW
EXECUTE FUNCTION update_vehicle_inspection_expiry();
