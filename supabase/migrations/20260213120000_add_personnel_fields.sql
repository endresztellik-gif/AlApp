-- Add new fields to Personnel ('Kolléga') entity type

WITH t AS (SELECT id FROM entity_types WHERE name = 'Kolléga')
INSERT INTO field_schemas (entity_type_id, field_name, field_key, field_type, is_required, display_order, alert_days_warning, alert_days_urgent, alert_days_critical) VALUES
  -- Kisgépkezelői
  ((SELECT id FROM t), 'Kisgépkezelői eng. száma', 'small_machine_license_number', 'text', false, 20, NULL, NULL, NULL),
  ((SELECT id FROM t), 'Kisgépkezelői orvosi érv.', 'small_machine_medical_expiry', 'date_expiry', false, 21, 60, 30, 7),
  
  -- Jogosítvány kategóriák (meglévő jogosítvány mellé)
  ((SELECT id FROM t), 'Jogosítvány kategóriák', 'driving_license_categories', 'text', false, 6, NULL, NULL, NULL), -- Inserted after license number (approx order)
  
  -- Rendészeti vizsga
  ((SELECT id FROM t), 'Rendészeti vizsga típusa', 'law_enforcement_exam_type', 'text', false, 30, NULL, NULL, NULL),
  ((SELECT id FROM t), 'Rendészeti vizsga biz. száma', 'law_enforcement_exam_number', 'text', false, 31, NULL, NULL, NULL),
  ((SELECT id FROM t), 'Rendészeti vizsga érv.', 'law_enforcement_exam_expiry', 'date_expiry', false, 32, 90, 30, 7),
  
  -- Őri/Halőri igazolvány
  ((SELECT id FROM t), 'Őri/Halőri ig. száma', 'warden_id_number', 'text', false, 40, NULL, NULL, NULL),
  ((SELECT id FROM t), 'Őri/Halőri jelvény száma', 'warden_badge_number', 'text', false, 41, NULL, NULL, NULL)
ON CONFLICT (entity_type_id, field_key) DO NOTHING;
