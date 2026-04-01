-- ============================================================
-- 0. field_type CHECK constraint bővítése multiselect-tel
-- ============================================================
ALTER TABLE field_schemas
  DROP CONSTRAINT IF EXISTS field_schemas_field_type_check;

ALTER TABLE field_schemas
  ADD CONSTRAINT field_schemas_field_type_check
  CHECK (field_type IN ('text','number','date','date_expiry','select','multiselect','file','textarea'));

-- ============================================================
-- 1. Hajóskönyv érvényessége mező törlése
--    (a hajóskönyvnek nincs érvényessége)
-- ============================================================
DELETE FROM field_schemas
WHERE field_key = 'boat_license_expiry'
  AND entity_type_id = (SELECT id FROM entity_types WHERE name = 'Kolléga');

-- ============================================================
-- 2. Hajós képesítés száma – új mező (a hajóskönyv szám után)
-- ============================================================
WITH t AS (SELECT id FROM entity_types WHERE name = 'Kolléga')
INSERT INTO field_schemas (
  entity_type_id, field_name, field_key, field_type,
  is_required, display_order,
  alert_days_warning, alert_days_urgent, alert_days_critical
)
VALUES (
  (SELECT id FROM t),
  'Hajós képesítés száma', 'sailor_qualification_number', 'text',
  false, 13,
  NULL, NULL, NULL
)
ON CONFLICT (entity_type_id, field_key) DO NOTHING;

-- ============================================================
-- 3. Jogosítvány kategóriák: text → multiselect
-- ============================================================
UPDATE field_schemas
SET
  field_type     = 'multiselect',
  select_options = '["AM","A1","A2","A","B1","B","C1","C","D1","D","BE","C1E","CE","D1E","DE","T","K"]'
WHERE field_key = 'driving_license_categories'
  AND entity_type_id = (SELECT id FROM entity_types WHERE name = 'Kolléga');
