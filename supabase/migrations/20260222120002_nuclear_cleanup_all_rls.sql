-- ============================================================
-- Nuclear RLS Cleanup
-- Drop ALL existing RLS policies to start fresh
-- ============================================================

DO $$
DECLARE
    r RECORD;
    table_list TEXT[] := ARRAY[
        'user_profiles',
        'entities',
        'field_values',
        'entity_user_links',
        'photos',
        'incidents',
        'incident_photos',
        'water_facilities',
        'water_facility_photos',
        'water_facility_documents',
        'maintenance_logs',
        'vehicle_checklists',
        'notification_log',
        'push_subscriptions',
        'audit_log',
        'app_settings',
        'feature_flags',
        'entity_types',
        'field_schemas'
    ];
    tbl TEXT;
BEGIN
    FOREACH tbl IN ARRAY table_list LOOP
        RAISE NOTICE 'Cleaning policies for table: %', tbl;

        FOR r IN (
            SELECT policyname
            FROM pg_policies
            WHERE tablename = tbl AND schemaname = 'public'
        ) LOOP
            EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.' || tbl;
            RAISE NOTICE '  Dropped policy: %', r.policyname;
        END LOOP;
    END LOOP;
END $$;
