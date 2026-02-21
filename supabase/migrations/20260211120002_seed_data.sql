-- ============================================================
-- AlApp – Kezdeti adatok (seed)
-- Feature flagek, entitás típusok, mező sémák
-- ============================================================

-- Feature flagek
INSERT INTO feature_flags (key, enabled, description) VALUES
  ('module_personnel', true, 'Személyek modul'),
  ('module_vehicles', true, 'Járművek modul'),
  ('module_equipment', true, 'Eszközök modul'),
  ('module_calendar', false, 'Szabadság-naptár modul'),
  ('module_incidents', true, 'Káresemény mini-app'),
  ('module_other', false, 'Egyéb modul (jövőbeli)'),
  ('feature_qr_codes', false, 'QR-kód funkció'),
  ('feature_offline_write', false, 'Offline írás');

-- Entitás típusok
INSERT INTO entity_types (name, module, icon) VALUES
  ('Kolléga', 'personnel', 'user'),
  ('Személyautó', 'vehicles', 'car'),
  ('Teherautó', 'vehicles', 'truck'),
  ('Traktor', 'vehicles', 'tractor'),
  ('Utánfutó', 'vehicles', 'trailer'),
  ('Hajó', 'vehicles', 'ship'),
  ('Láncfűrész', 'equipment', 'saw'),
  ('GPS', 'equipment', 'map-pin'),
  ('Drón', 'equipment', 'plane');

-- Mező sémák – Kolléga
WITH t AS (SELECT id FROM entity_types WHERE name = 'Kolléga')
INSERT INTO field_schemas (entity_type_id, field_name, field_key, field_type, is_required, display_order, alert_days_warning, alert_days_urgent, alert_days_critical) VALUES
  ((SELECT id FROM t), 'Születési idő', 'birth_date', 'date', false, 1, 90, 30, 7),
  ((SELECT id FROM t), 'Születési hely', 'birth_place', 'text', false, 2, 90, 30, 7),
  ((SELECT id FROM t), 'Személyi ig. száma', 'id_card_number', 'text', false, 3, 90, 30, 7),
  ((SELECT id FROM t), 'Személyi ig. érvényessége', 'id_card_expiry', 'date_expiry', false, 4, 90, 30, 7),
  ((SELECT id FROM t), 'Jogosítvány száma', 'drivers_license_number', 'text', false, 5, 90, 30, 7),
  ((SELECT id FROM t), 'Jogosítvány érvényessége', 'drivers_license_expiry', 'date_expiry', false, 6, 90, 30, 7),
  ((SELECT id FROM t), 'Üzemorvosi érvényessége', 'medical_expiry', 'date_expiry', false, 7, 60, 30, 7),
  ((SELECT id FROM t), 'Fegyvertartási eng. száma', 'firearm_license_number', 'text', false, 8, 90, 30, 7),
  ((SELECT id FROM t), 'Fegyvertartási eng. érvényessége', 'firearm_license_expiry', 'date_expiry', false, 9, 90, 30, 7),
  ((SELECT id FROM t), 'Fegyvertartási orvosi érv.', 'firearm_medical_expiry', 'date_expiry', false, 10, 90, 30, 7),
  ((SELECT id FROM t), 'Fegyvertartási pszich. érv.', 'firearm_psych_expiry', 'date_expiry', false, 11, 90, 30, 7),
  ((SELECT id FROM t), 'Hajóskönyv száma', 'boat_license_number', 'text', false, 12, 90, 30, 7),
  ((SELECT id FROM t), 'Hajóskönyv érvényessége', 'boat_license_expiry', 'date_expiry', false, 13, 90, 30, 7),
  ((SELECT id FROM t), 'Hajóskönyv eü. érvényessége', 'boat_medical_expiry', 'date_expiry', false, 14, 90, 30, 7);

-- Mező sémák – Személyautó
WITH t AS (SELECT id FROM entity_types WHERE name = 'Személyautó')
INSERT INTO field_schemas (entity_type_id, field_name, field_key, field_type, is_required, display_order, select_options) VALUES
  ((SELECT id FROM t), 'Rendszám', 'license_plate', 'text', true, 1, NULL),
  ((SELECT id FROM t), 'Forgalmi eng. száma', 'registration_number', 'text', false, 2, NULL),
  ((SELECT id FROM t), 'Forgalmi eng. lejárata', 'registration_expiry', 'date_expiry', false, 3, NULL),
  ((SELECT id FROM t), 'Műszaki vizsga lejárata', 'inspection_expiry', 'date_expiry', false, 4, NULL),
  ((SELECT id FROM t), 'Utolsó javítás ideje', 'last_repair_date', 'date', false, 5, NULL),
  ((SELECT id FROM t), 'Állapot', 'status', 'select', false, 6, '["aktív", "javításra vár", "selejtezett"]');

-- Mező sémák – Teherautó (azonos a személyautóval)
WITH t AS (SELECT id FROM entity_types WHERE name = 'Teherautó')
INSERT INTO field_schemas (entity_type_id, field_name, field_key, field_type, is_required, display_order, select_options) VALUES
  ((SELECT id FROM t), 'Rendszám', 'license_plate', 'text', true, 1, NULL),
  ((SELECT id FROM t), 'Forgalmi eng. száma', 'registration_number', 'text', false, 2, NULL),
  ((SELECT id FROM t), 'Forgalmi eng. lejárata', 'registration_expiry', 'date_expiry', false, 3, NULL),
  ((SELECT id FROM t), 'Műszaki vizsga lejárata', 'inspection_expiry', 'date_expiry', false, 4, NULL),
  ((SELECT id FROM t), 'Utolsó javítás ideje', 'last_repair_date', 'date', false, 5, NULL),
  ((SELECT id FROM t), 'Állapot', 'status', 'select', false, 6, '["aktív", "javításra vár", "selejtezett"]');

-- Mező sémák – Utánfutó (egyszerűbb)
WITH t AS (SELECT id FROM entity_types WHERE name = 'Utánfutó')
INSERT INTO field_schemas (entity_type_id, field_name, field_key, field_type, is_required, display_order) VALUES
  ((SELECT id FROM t), 'Rendszám', 'license_plate', 'text', true, 1),
  ((SELECT id FROM t), 'Forgalmi eng. száma', 'registration_number', 'text', false, 2),
  ((SELECT id FROM t), 'Forgalmi eng. lejárata', 'registration_expiry', 'date_expiry', false, 3);

-- App beállítások
INSERT INTO app_settings (key, value) VALUES
  ('notification_enabled', 'true'::jsonb),
  ('notification_check_hour', '8'::jsonb),
  ('app_version', '"1.0.0"'::jsonb);
