-- ============================================================
-- Migrate Data from entities to Dedicated Tables
-- Created: 2026-02-24
-- Description: Migrálás entities → personnel/vehicles/equipment
--              field_values EAV → JSONB field_values
-- ============================================================

-- IMPORTANT: Ez a migráció ÁLLAPOTVÁLTOZTATÓ!
-- Backup javasolt futtatás előtt: supabase db dump -f backup_pre_refactor_$(date +%Y%m%d_%H%M%S).sql

-- ============================================================
-- PHASE 1: Migrate Personnel
-- ============================================================

DO $$
DECLARE
  entities_personnel_count INT;
  personnel_migrated_count INT;
BEGIN
  -- Count entities to migrate
  SELECT COUNT(*) INTO entities_personnel_count FROM entities WHERE module = 'personnel';

  RAISE NOTICE 'Starting personnel migration: % records to migrate', entities_personnel_count;

  -- Insert base entity data
  INSERT INTO personnel (
    id,
    entity_type_id,
    display_name,
    responsible_user_id,
    is_active,
    created_by,
    created_at,
    updated_at
  )
  SELECT
    id,
    entity_type_id,
    display_name,
    responsible_user_id,
    is_active,
    NULL, -- created_by: no auth context during migration, will be NULL
    created_at,
    updated_at
  FROM entities
  WHERE module = 'personnel';

  SELECT COUNT(*) INTO personnel_migrated_count FROM personnel;

  RAISE NOTICE 'Personnel base data migrated: % records', personnel_migrated_count;

  -- Aggregate field_values into JSONB
  UPDATE personnel p
  SET field_values = COALESCE(
    (
      SELECT jsonb_object_agg(
        fs.field_key,
        CASE
          WHEN fv.value_text IS NOT NULL THEN to_jsonb(fv.value_text)
          WHEN fv.value_date IS NOT NULL THEN to_jsonb(fv.value_date::text)
          WHEN fv.value_json IS NOT NULL THEN fv.value_json
          ELSE 'null'::jsonb
        END
      )
      FROM field_values fv
      JOIN field_schemas fs ON fv.field_schema_id = fs.id
      WHERE fv.entity_id = p.id
    ),
    '{}'::jsonb
  );

  RAISE NOTICE 'Personnel field_values aggregated';

  -- Verify migration
  IF entities_personnel_count != personnel_migrated_count THEN
    RAISE EXCEPTION 'Personnel migration FAILED: % entities vs % personnel',
      entities_personnel_count, personnel_migrated_count;
  END IF;

  RAISE NOTICE '✅ Personnel migration successful: % records', personnel_migrated_count;
END $$;

-- ============================================================
-- PHASE 2: Migrate Vehicles
-- ============================================================

DO $$
DECLARE
  entities_vehicles_count INT;
  vehicles_migrated_count INT;
BEGIN
  SELECT COUNT(*) INTO entities_vehicles_count FROM entities WHERE module = 'vehicles';

  RAISE NOTICE 'Starting vehicles migration: % records to migrate', entities_vehicles_count;

  -- Insert base entity data
  INSERT INTO vehicles (
    id,
    entity_type_id,
    display_name,
    responsible_user_id,
    is_active,
    created_by,
    created_at,
    updated_at
  )
  SELECT
    id,
    entity_type_id,
    display_name,
    responsible_user_id,
    is_active,
    NULL, -- created_by: no auth context during migration
    created_at,
    updated_at
  FROM entities
  WHERE module = 'vehicles';

  SELECT COUNT(*) INTO vehicles_migrated_count FROM vehicles;

  RAISE NOTICE 'Vehicles base data migrated: % records', vehicles_migrated_count;

  -- Aggregate field_values into JSONB
  UPDATE vehicles v
  SET field_values = COALESCE(
    (
      SELECT jsonb_object_agg(
        fs.field_key,
        CASE
          WHEN fv.value_text IS NOT NULL THEN to_jsonb(fv.value_text)
          WHEN fv.value_date IS NOT NULL THEN to_jsonb(fv.value_date::text)
          WHEN fv.value_json IS NOT NULL THEN fv.value_json
          ELSE 'null'::jsonb
        END
      )
      FROM field_values fv
      JOIN field_schemas fs ON fv.field_schema_id = fs.id
      WHERE fv.entity_id = v.id
    ),
    '{}'::jsonb
  );

  RAISE NOTICE 'Vehicles field_values aggregated';

  -- Verify migration
  IF entities_vehicles_count != vehicles_migrated_count THEN
    RAISE EXCEPTION 'Vehicles migration FAILED: % entities vs % vehicles',
      entities_vehicles_count, vehicles_migrated_count;
  END IF;

  RAISE NOTICE '✅ Vehicles migration successful: % records', vehicles_migrated_count;
END $$;

-- ============================================================
-- PHASE 3: Migrate Equipment
-- ============================================================

DO $$
DECLARE
  entities_equipment_count INT;
  equipment_migrated_count INT;
BEGIN
  SELECT COUNT(*) INTO entities_equipment_count FROM entities WHERE module = 'equipment';

  RAISE NOTICE 'Starting equipment migration: % records to migrate', entities_equipment_count;

  -- Insert base entity data
  INSERT INTO equipment (
    id,
    entity_type_id,
    display_name,
    responsible_user_id,
    is_active,
    created_by,
    created_at,
    updated_at
  )
  SELECT
    id,
    entity_type_id,
    display_name,
    responsible_user_id,
    is_active,
    NULL, -- created_by: no auth context during migration
    created_at,
    updated_at
  FROM entities
  WHERE module = 'equipment';

  SELECT COUNT(*) INTO equipment_migrated_count FROM equipment;

  RAISE NOTICE 'Equipment base data migrated: % records', equipment_migrated_count;

  -- Aggregate field_values into JSONB
  UPDATE equipment e
  SET field_values = COALESCE(
    (
      SELECT jsonb_object_agg(
        fs.field_key,
        CASE
          WHEN fv.value_text IS NOT NULL THEN to_jsonb(fv.value_text)
          WHEN fv.value_date IS NOT NULL THEN to_jsonb(fv.value_date::text)
          WHEN fv.value_json IS NOT NULL THEN fv.value_json
          ELSE 'null'::jsonb
        END
      )
      FROM field_values fv
      JOIN field_schemas fs ON fv.field_schema_id = fs.id
      WHERE fv.entity_id = e.id
    ),
    '{}'::jsonb
  );

  RAISE NOTICE 'Equipment field_values aggregated';

  -- Verify migration
  IF entities_equipment_count != equipment_migrated_count THEN
    RAISE EXCEPTION 'Equipment migration FAILED: % entities vs % equipment',
      entities_equipment_count, equipment_migrated_count;
  END IF;

  RAISE NOTICE '✅ Equipment migration successful: % records', equipment_migrated_count;
END $$;

-- ============================================================
-- PHASE 4: Final Verification
-- ============================================================

DO $$
DECLARE
  total_entities_count INT;
  total_migrated_count INT;
BEGIN
  SELECT COUNT(*) INTO total_entities_count
  FROM entities
  WHERE module IN ('personnel', 'vehicles', 'equipment');

  SELECT
    (SELECT COUNT(*) FROM personnel) +
    (SELECT COUNT(*) FROM vehicles) +
    (SELECT COUNT(*) FROM equipment)
  INTO total_migrated_count;

  IF total_entities_count != total_migrated_count THEN
    RAISE EXCEPTION 'TOTAL MIGRATION FAILED: % entities vs % total migrated',
      total_entities_count, total_migrated_count;
  END IF;

  RAISE NOTICE '✅✅✅ MIGRATION COMPLETE: % total records migrated successfully', total_migrated_count;
  RAISE NOTICE 'Personnel: % | Vehicles: % | Equipment: %',
    (SELECT COUNT(*) FROM personnel),
    (SELECT COUNT(*) FROM vehicles),
    (SELECT COUNT(*) FROM equipment);
END $$;

-- ============================================================
-- MANUAL VERIFICATION QUERIES (run these to verify migration)
-- ============================================================

-- Compare row counts:
-- SELECT
--   'entities' as source, module, COUNT(*)
-- FROM entities
-- WHERE module IN ('personnel', 'vehicles', 'equipment')
-- GROUP BY module
-- UNION ALL
-- SELECT 'personnel' as source, 'personnel' as module, COUNT(*) FROM personnel
-- UNION ALL
-- SELECT 'vehicles', 'vehicles', COUNT(*) FROM vehicles
-- UNION ALL
-- SELECT 'equipment', 'equipment', COUNT(*) FROM equipment;

-- Sample field_values JSONB check:
-- SELECT id, display_name, field_values FROM personnel LIMIT 5;
-- SELECT id, display_name, field_values FROM vehicles LIMIT 5;
-- SELECT id, display_name, field_values FROM equipment LIMIT 5;

-- ============================================================
-- End of Data Migration
-- ============================================================
