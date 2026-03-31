-- ============================================================
-- 1. Motor entity_type field sémák (ua. mint többi jármű)
-- ============================================================
DO $$
DECLARE
    motor_id UUID;
BEGIN
    SELECT id INTO motor_id FROM entity_types WHERE name = 'Motor' AND module = 'vehicles';
    IF motor_id IS NULL THEN RETURN; END IF;

    INSERT INTO field_schemas (entity_type_id, field_name, field_key, field_type, is_required, display_order)
    SELECT motor_id, 'Rendszám', 'license_plate', 'text', true, 1
    WHERE NOT EXISTS (SELECT 1 FROM field_schemas WHERE entity_type_id = motor_id AND field_key = 'license_plate');

    INSERT INTO field_schemas (entity_type_id, field_name, field_key, field_type, is_required, display_order)
    SELECT motor_id, 'Forgalmi eng. száma', 'registration_number', 'text', false, 2
    WHERE NOT EXISTS (SELECT 1 FROM field_schemas WHERE entity_type_id = motor_id AND field_key = 'registration_number');

    INSERT INTO field_schemas (entity_type_id, field_name, field_key, field_type, is_required, display_order,
        alert_days_warning, alert_days_urgent, alert_days_critical)
    SELECT motor_id, 'Forgalmi eng. lejárata', 'registration_expiry', 'date_expiry', false, 3, 90, 30, 7
    WHERE NOT EXISTS (SELECT 1 FROM field_schemas WHERE entity_type_id = motor_id AND field_key = 'registration_expiry');

    INSERT INTO field_schemas (entity_type_id, field_name, field_key, field_type, is_required, display_order,
        alert_days_warning, alert_days_urgent, alert_days_critical)
    SELECT motor_id, 'Műszaki vizsga lejárata', 'inspection_expiry', 'date_expiry', false, 4, 90, 30, 7
    WHERE NOT EXISTS (SELECT 1 FROM field_schemas WHERE entity_type_id = motor_id AND field_key = 'inspection_expiry');

    RAISE NOTICE 'Motor field schemas added';
END $$;

-- ============================================================
-- 2. vehicles RLS: reader → vezető
-- ============================================================
DROP POLICY IF EXISTS "reader_insert_vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "reader_update_vehicles" ON public.vehicles;

CREATE POLICY "vezeto_insert_vehicles" ON public.vehicles
  FOR INSERT TO authenticated
  WITH CHECK (
    get_user_role() = 'vezető' AND
    created_by = auth.uid()
  );

CREATE POLICY "vezeto_update_vehicles" ON public.vehicles
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
