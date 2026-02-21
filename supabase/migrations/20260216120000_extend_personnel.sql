
-- 1. Insert New Personnel Types
INSERT INTO entity_types (name, module)
SELECT 'Kormánytisztviselő', 'personnel'
WHERE NOT EXISTS (SELECT 1 FROM entity_types WHERE name = 'Kormánytisztviselő' AND module = 'personnel');

INSERT INTO entity_types (name, module)
SELECT 'Munka törvénykönyves', 'personnel'
WHERE NOT EXISTS (SELECT 1 FROM entity_types WHERE name = 'Munka törvénykönyves' AND module = 'personnel');

INSERT INTO entity_types (name, module)
SELECT 'Egyéb', 'personnel'
WHERE NOT EXISTS (SELECT 1 FROM entity_types WHERE name = 'Egyéb' AND module = 'personnel');

-- 2. Copy Fields from 'Kolléga' to new types
DO $$
DECLARE
    koll_id uuid;
    new_type_id uuid;
    target_type text;
BEGIN
    -- Get source type ID
    SELECT id INTO koll_id FROM entity_types WHERE name = 'Kolléga' AND module = 'personnel' LIMIT 1;
    
    IF koll_id IS NULL THEN
        RAISE NOTICE 'Kolléga type not found, skipping field copy.';
        RETURN;
    END IF;

    -- Iterate over new types
    FOREACH target_type IN ARRAY ARRAY['Kormánytisztviselő', 'Munka törvénykönyves', 'Egyéb'] LOOP
        -- Get target type ID
        SELECT id INTO new_type_id FROM entity_types WHERE name = target_type AND module = 'personnel' LIMIT 1;
        
        IF new_type_id IS NOT NULL THEN
            -- Copy fields if they don't exist
            INSERT INTO field_schemas (
                entity_type_id, 
                field_name, 
                field_key, 
                field_type, 
                is_required, 
                select_options, 
                display_order, 
                alert_days_warning, 
                alert_days_urgent, 
                alert_days_critical
            )
            SELECT 
                new_type_id, 
                field_name, 
                field_key, 
                field_type, 
                is_required, 
                select_options, 
                display_order, 
                alert_days_warning, 
                alert_days_urgent, 
                alert_days_critical
            FROM field_schemas
            WHERE entity_type_id = koll_id
            AND NOT EXISTS (
                SELECT 1 FROM field_schemas 
                WHERE entity_type_id = new_type_id 
                AND field_key = field_schemas.field_key
            );
            
            RAISE NOTICE 'Copied fields to %', target_type;
        END IF;
    END LOOP;
END $$;
