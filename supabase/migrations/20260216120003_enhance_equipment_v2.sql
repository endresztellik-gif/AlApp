
-- 1. Insert New Equipment Types
INSERT INTO entity_types (name, module) 
SELECT 'Fűkasza', 'equipment'
WHERE NOT EXISTS (SELECT 1 FROM entity_types WHERE name = 'Fűkasza' AND module = 'equipment');

INSERT INTO entity_types (name, module)
SELECT 'Egyéb', 'equipment'
WHERE NOT EXISTS (SELECT 1 FROM entity_types WHERE name = 'Egyéb' AND module = 'equipment');

-- 2. Add Fields to All Equipment Types
DO $$
DECLARE
    target_type RECORD;
BEGIN
    FOR target_type IN SELECT id, name FROM entity_types WHERE module = 'equipment' LOOP
        
        -- Serial Number
        INSERT INTO field_schemas (entity_type_id, field_name, field_key, field_type, display_order)
        SELECT target_type.id, 'Széria szám', 'serial_number', 'text', 10
        WHERE NOT EXISTS (SELECT 1 FROM field_schemas WHERE entity_type_id = target_type.id AND field_key = 'serial_number');

        -- Commission Date
        INSERT INTO field_schemas (entity_type_id, field_name, field_key, field_type, display_order)
        SELECT target_type.id, 'Használatba vétel dátuma', 'commission_date', 'date', 11
        WHERE NOT EXISTS (SELECT 1 FROM field_schemas WHERE entity_type_id = target_type.id AND field_key = 'commission_date');

        -- Inventory Responsible
        INSERT INTO field_schemas (entity_type_id, field_name, field_key, field_type, display_order)
        SELECT target_type.id, 'Leltárfelelős', 'inventory_responsible', 'text', 12
        WHERE NOT EXISTS (SELECT 1 FROM field_schemas WHERE entity_type_id = target_type.id AND field_key = 'inventory_responsible');

        -- Description (Textarea)
        INSERT INTO field_schemas (entity_type_id, field_name, field_key, field_type, display_order)
        SELECT target_type.id, 'Megjegyzés', 'description', 'text', 99
        WHERE NOT EXISTS (SELECT 1 FROM field_schemas WHERE entity_type_id = target_type.id AND field_key = 'description');

        RAISE NOTICE 'Updated fields for %', target_type.name;
    END LOOP;
END $$;
