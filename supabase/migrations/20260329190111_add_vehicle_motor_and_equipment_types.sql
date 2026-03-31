-- ============================================================
-- Új jármű és eszköz típusok
-- Created: 2026-03-29
-- ============================================================

-- 1. Jármű: Motor
INSERT INTO entity_types (name, module)
SELECT 'Motor', 'vehicles'
WHERE NOT EXISTS (SELECT 1 FROM entity_types WHERE name = 'Motor' AND module = 'vehicles');

-- 2. Új eszköz típusok
INSERT INTO entity_types (name, module)
SELECT 'Áramfejlesztő', 'equipment'
WHERE NOT EXISTS (SELECT 1 FROM entity_types WHERE name = 'Áramfejlesztő' AND module = 'equipment');

INSERT INTO entity_types (name, module)
SELECT 'Fa vizsgáló - Fakopp', 'equipment'
WHERE NOT EXISTS (SELECT 1 FROM entity_types WHERE name = 'Fa vizsgáló - Fakopp' AND module = 'equipment');

INSERT INTO entity_types (name, module)
SELECT 'Magassági ágvágó', 'equipment'
WHERE NOT EXISTS (SELECT 1 FROM entity_types WHERE name = 'Magassági ágvágó' AND module = 'equipment');

INSERT INTO entity_types (name, module)
SELECT 'Gödörfúró', 'equipment'
WHERE NOT EXISTS (SELECT 1 FROM entity_types WHERE name = 'Gödörfúró' AND module = 'equipment');

-- 3. Field schemas az új eszköz típusokhoz
DO $$
DECLARE
    target_type RECORD;
BEGIN
    FOR target_type IN
        SELECT id, name FROM entity_types
        WHERE module = 'equipment'
          AND name IN ('Áramfejlesztő', 'Fa vizsgáló - Fakopp', 'Magassági ágvágó', 'Gödörfúró')
    LOOP
        INSERT INTO field_schemas (entity_type_id, field_name, field_key, field_type, display_order)
        SELECT target_type.id, 'Széria szám', 'serial_number', 'text', 10
        WHERE NOT EXISTS (SELECT 1 FROM field_schemas WHERE entity_type_id = target_type.id AND field_key = 'serial_number');

        INSERT INTO field_schemas (entity_type_id, field_name, field_key, field_type, display_order)
        SELECT target_type.id, 'Használatba vétel dátuma', 'commission_date', 'date', 11
        WHERE NOT EXISTS (SELECT 1 FROM field_schemas WHERE entity_type_id = target_type.id AND field_key = 'commission_date');

        INSERT INTO field_schemas (entity_type_id, field_name, field_key, field_type, display_order)
        SELECT target_type.id, 'Leltárfelelős', 'inventory_responsible', 'text', 12
        WHERE NOT EXISTS (SELECT 1 FROM field_schemas WHERE entity_type_id = target_type.id AND field_key = 'inventory_responsible');

        INSERT INTO field_schemas (entity_type_id, field_name, field_key, field_type, display_order)
        SELECT target_type.id, 'Megjegyzés', 'description', 'text', 99
        WHERE NOT EXISTS (SELECT 1 FROM field_schemas WHERE entity_type_id = target_type.id AND field_key = 'description');

        RAISE NOTICE 'Fields added for: %', target_type.name;
    END LOOP;
END $$;
