-- Ensure 'Kolléga' entity type exists for 'personnel'
INSERT INTO entity_types (name, module, icon)
VALUES ('Kolléga', 'personnel', 'user')
ON CONFLICT (name, module) DO NOTHING;

-- Add 'Jogviszony' field to 'Kolléga'
WITH t AS (SELECT id FROM entity_types WHERE name = 'Kolléga' AND module = 'personnel')
INSERT INTO field_schemas (entity_type_id, field_name, field_key, field_type, is_required, display_order, select_options)
SELECT 
    id, 
    'Jogviszony', 
    'legal_status', 
    'select', 
    false, 
    15, 
    '["Munkaviszony", "Megbízási jogviszony", "Közalkalmazott", "Kormánytisztviselő", "Egyéb"]'::jsonb
FROM t
WHERE NOT EXISTS (
    SELECT 1 FROM field_schemas 
    WHERE entity_type_id = (SELECT id FROM t) 
    AND field_key = 'legal_status'
);
