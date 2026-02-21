
-- 1. Insert Types
INSERT INTO entity_types (name, module) VALUES ('Láncfűrész', 'equipment') ON CONFLICT (name, module) DO NOTHING;
INSERT INTO entity_types (name, module) VALUES ('Fűkasza', 'equipment') ON CONFLICT (name, module) DO NOTHING;
INSERT INTO entity_types (name, module) VALUES ('Egyéb', 'equipment') ON CONFLICT (name, module) DO NOTHING;

-- 2. Insert Fields for Láncfűrész
INSERT INTO field_schemas (entity_type_id, field_name, field_key, field_type, display_order)
SELECT id, 'Széria szám', 'serial_number', 'text', 10
FROM entity_types WHERE name = 'Láncfűrész' AND module = 'equipment'
AND NOT EXISTS (SELECT 1 FROM field_schemas WHERE entity_type_id = entity_types.id AND field_key = 'serial_number');

INSERT INTO field_schemas (entity_type_id, field_name, field_key, field_type, display_order)
SELECT id, 'Használatba vétel dátuma', 'commission_date', 'date', 11
FROM entity_types WHERE name = 'Láncfűrész' AND module = 'equipment'
AND NOT EXISTS (SELECT 1 FROM field_schemas WHERE entity_type_id = entity_types.id AND field_key = 'commission_date');

INSERT INTO field_schemas (entity_type_id, field_name, field_key, field_type, display_order)
SELECT id, 'Leltárfelelős', 'inventory_responsible', 'text', 12
FROM entity_types WHERE name = 'Láncfűrész' AND module = 'equipment'
AND NOT EXISTS (SELECT 1 FROM field_schemas WHERE entity_type_id = entity_types.id AND field_key = 'inventory_responsible');

-- 3. Insert Fields for Fűkasza
INSERT INTO field_schemas (entity_type_id, field_name, field_key, field_type, display_order)
SELECT id, 'Széria szám', 'serial_number', 'text', 10
FROM entity_types WHERE name = 'Fűkasza' AND module = 'equipment'
AND NOT EXISTS (SELECT 1 FROM field_schemas WHERE entity_type_id = entity_types.id AND field_key = 'serial_number');

INSERT INTO field_schemas (entity_type_id, field_name, field_key, field_type, display_order)
SELECT id, 'Használatba vétel dátuma', 'commission_date', 'date', 11
FROM entity_types WHERE name = 'Fűkasza' AND module = 'equipment'
AND NOT EXISTS (SELECT 1 FROM field_schemas WHERE entity_type_id = entity_types.id AND field_key = 'commission_date');

INSERT INTO field_schemas (entity_type_id, field_name, field_key, field_type, display_order)
SELECT id, 'Leltárfelelős', 'inventory_responsible', 'text', 12
FROM entity_types WHERE name = 'Fűkasza' AND module = 'equipment'
AND NOT EXISTS (SELECT 1 FROM field_schemas WHERE entity_type_id = entity_types.id AND field_key = 'inventory_responsible');

-- 4. Insert Fields for Egyéb
INSERT INTO field_schemas (entity_type_id, field_name, field_key, field_type, display_order)
SELECT id, 'Széria szám', 'serial_number', 'text', 10
FROM entity_types WHERE name = 'Egyéb' AND module = 'equipment'
AND NOT EXISTS (SELECT 1 FROM field_schemas WHERE entity_type_id = entity_types.id AND field_key = 'serial_number');

INSERT INTO field_schemas (entity_type_id, field_name, field_key, field_type, display_order)
SELECT id, 'Használatba vétel dátuma', 'commission_date', 'date', 11
FROM entity_types WHERE name = 'Egyéb' AND module = 'equipment'
AND NOT EXISTS (SELECT 1 FROM field_schemas WHERE entity_type_id = entity_types.id AND field_key = 'commission_date');

INSERT INTO field_schemas (entity_type_id, field_name, field_key, field_type, display_order)
SELECT id, 'Leltárfelelős', 'inventory_responsible', 'text', 12
FROM entity_types WHERE name = 'Egyéb' AND module = 'equipment'
AND NOT EXISTS (SELECT 1 FROM field_schemas WHERE entity_type_id = entity_types.id AND field_key = 'inventory_responsible');
