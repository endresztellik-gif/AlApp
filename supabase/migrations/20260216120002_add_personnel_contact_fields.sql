-- Add 'email' and 'phone' fields to Personnel modules

WITH 
  t_colleague AS (SELECT id FROM entity_types WHERE name = 'Kolléga'),
  t_gov AS (SELECT id FROM entity_types WHERE name = 'Kormánytisztviselő'),
  t_labor AS (SELECT id FROM entity_types WHERE name = 'Munka törvénykönyves'),
  t_other AS (SELECT id FROM entity_types WHERE name = 'Egyéb')

INSERT INTO field_schemas (entity_type_id, field_name, field_key, field_type, is_required, display_order, alert_days_warning, alert_days_urgent, alert_days_critical) VALUES
  -- Kolléga
  ((SELECT id FROM t_colleague), 'Email cím', 'email', 'text', false, 2, NULL, NULL, NULL),
  ((SELECT id FROM t_colleague), 'Telefonszám', 'phone', 'text', false, 3, NULL, NULL, NULL),

  -- Kormánytisztviselő
  ((SELECT id FROM t_gov), 'Email cím', 'email', 'text', false, 2, NULL, NULL, NULL),
  ((SELECT id FROM t_gov), 'Telefonszám', 'phone', 'text', false, 3, NULL, NULL, NULL),

  -- Munka törvénykönyves
  ((SELECT id FROM t_labor), 'Email cím', 'email', 'text', false, 2, NULL, NULL, NULL),
  ((SELECT id FROM t_labor), 'Telefonszám', 'phone', 'text', false, 3, NULL, NULL, NULL),

  -- Egyéb
  ((SELECT id FROM t_other), 'Email cím', 'email', 'text', false, 2, NULL, NULL, NULL),
  ((SELECT id FROM t_other), 'Telefonszám', 'phone', 'text', false, 3, NULL, NULL, NULL)
ON CONFLICT (entity_type_id, field_key) DO NOTHING;
