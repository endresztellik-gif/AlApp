-- ============================================================
-- Database Cleanup - Teszt Adatok Törlése
-- MEGTARTJUK: user_profiles, entity_types, field_schemas,
--             app_settings, feature_flags
-- TÖRÖLJÜK: entities, incidents, water_facilities és
--           minden kapcsolódó adat
-- ============================================================
-- FIGYELEM: Ez a migráció VISSZAFORDÍTHATATLAN!
-- Minden teszt adat törlésre kerül!
-- ============================================================

DO $$
BEGIN
    RAISE NOTICE 'Starting database cleanup...';
    RAISE NOTICE 'WARNING: This will delete ALL test data!';

    -- ============================================================
    -- 1. Entitás-kapcsolódó adatok törlése
    -- ============================================================
    RAISE NOTICE 'Deleting field_values...';
    DELETE FROM field_values;

    RAISE NOTICE 'Deleting photos...';
    DELETE FROM photos;

    RAISE NOTICE 'Deleting entity_user_links...';
    DELETE FROM entity_user_links;

    RAISE NOTICE 'Deleting maintenance_logs...';
    DELETE FROM maintenance_logs;

    RAISE NOTICE 'Deleting vehicle_checklists...';
    DELETE FROM vehicle_checklists;

    -- ============================================================
    -- 2. Entitások törlése (gépjárművek, személyek, eszközök)
    -- ============================================================
    RAISE NOTICE 'Deleting entities...';
    DELETE FROM entities;

    -- ============================================================
    -- 3. Káresemények törlése
    -- ============================================================
    RAISE NOTICE 'Deleting incident_photos...';
    DELETE FROM incident_photos;

    RAISE NOTICE 'Deleting incidents...';
    DELETE FROM incidents;

    -- ============================================================
    -- 4. Vízművel kapcsolatos adatok
    -- ============================================================
    RAISE NOTICE 'Deleting water_facility_photos...';
    DELETE FROM water_facility_photos;

    RAISE NOTICE 'Deleting water_facility_documents...';
    DELETE FROM water_facility_documents;

    RAISE NOTICE 'Deleting water_facilities...';
    DELETE FROM water_facilities;

    -- ============================================================
    -- 5. Értesítések törlése
    -- ============================================================
    RAISE NOTICE 'Deleting notification_log...';
    DELETE FROM notification_log;

    RAISE NOTICE 'Deleting push_subscriptions...';
    DELETE FROM push_subscriptions;

    -- ============================================================
    -- MEGTARTOTT TÁBLÁK (NEM TÖRÖLJÜK):
    -- - user_profiles (felhasználók)
    -- - entity_types (entitás típusok)
    -- - field_schemas (mező sémák)
    -- - app_settings (alkalmazás beállítások)
    -- - feature_flags (feature flag-ek)
    -- - audit_log (audit napló)
    -- ============================================================

    RAISE NOTICE 'Database cleanup completed successfully!';
    RAISE NOTICE 'Preserved: user_profiles, entity_types, field_schemas, app_settings, feature_flags';
END $$;
