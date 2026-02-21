    -- 1. Helper function to get role
    CREATE OR REPLACE FUNCTION public.get_my_role()
    RETURNS text AS $$
    DECLARE
    v_role text;
    BEGIN
    SELECT role INTO v_role FROM public.user_profiles WHERE id = auth.uid();
    RETURN v_role;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- 2. Add 'created_by' column to entities if it doesn't exist
    -- This ensures we can track who created the record.
    DO $$ 
    BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'entities' AND column_name = 'created_by') THEN
            ALTER TABLE entities ADD COLUMN created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid();
            
            -- Optional: Update existing records to be owned by the current user (if running as admin) or leave null
            -- UPDATE entities SET created_by = auth.uid() WHERE created_by IS NULL;
        END IF;
    END $$;

    -- 2b. Drop existing permissive policies
    DROP POLICY IF EXISTS "Enable all access for authenticated users" ON entities;
    DROP POLICY IF EXISTS "Enable all access for authenticated users" ON field_values;
    -- Drop previous attempts if they exist
    DROP POLICY IF EXISTS "Allow view for all authenticated" ON entities;
    DROP POLICY IF EXISTS "Allow insert for admin and user" ON entities;
    DROP POLICY IF EXISTS "Allow update for admin" ON entities;
    DROP POLICY IF EXISTS "Allow update for admin and user" ON entities;
    DROP POLICY IF EXISTS "Allow update for owner or admin" ON entities;
    DROP POLICY IF EXISTS "Allow delete for admin" ON entities;


    -- 3. Define fine-grained policies for Entities

    -- SELECT: Everyone can view
    CREATE POLICY "Allow view for all authenticated" ON entities
        FOR SELECT TO authenticated
        USING (true);

    -- INSERT: Admins and Users
    -- Implicitly, the 'created_by' column will be set to auth.uid() by default, 
    -- or we can force it via trigger, but DEFAULT is usually enough for INSERT.
    CREATE POLICY "Allow insert for admin and user" ON entities
        FOR INSERT TO authenticated
        WITH CHECK (get_my_role() IN ('admin', 'user'));

    -- UPDATE: Admin OR Owner (User who created it)
    CREATE POLICY "Allow update for owner or admin" ON entities
        FOR UPDATE TO authenticated
        USING (
            get_my_role() = 'admin' 
            OR 
            (get_my_role() = 'user' AND created_by = auth.uid())
        )
        WITH CHECK (
            get_my_role() = 'admin' 
            OR 
            (get_my_role() = 'user' AND created_by = auth.uid())
        );

    -- DELETE: Admins only
    CREATE POLICY "Allow delete for admin" ON entities
        FOR DELETE TO authenticated
        USING (get_my_role() = 'admin');


    -- 4. Define policies for Field Values (cascade logic coverage)
    -- Field values don't have created_by, so we check the parent entity.

    -- Drop previous policies for field_values
    DROP POLICY IF EXISTS "Allow view for all authenticated" ON field_values;
    DROP POLICY IF EXISTS "Allow insert for admin and user" ON field_values;
    DROP POLICY IF EXISTS "Allow insert for owner or admin" ON field_values;
    DROP POLICY IF EXISTS "Allow update for admin" ON field_values;
    DROP POLICY IF EXISTS "Allow update for admin and user" ON field_values;
    DROP POLICY IF EXISTS "Allow update for owner or admin" ON field_values;
    DROP POLICY IF EXISTS "Allow delete for admin" ON field_values;
    DROP POLICY IF EXISTS "Allow delete for admin and user" ON field_values;
    DROP POLICY IF EXISTS "Allow delete for owner or admin" ON field_values;

    -- SELECT
    CREATE POLICY "Allow view for all authenticated" ON field_values
        FOR SELECT TO authenticated
        USING (true);

    -- INSERT
    -- Allow insert if user can insert/update the parent entity? 
    -- Or easier: Allow insert for all users/admins, assuming app logic connects to valid entity.
    -- Better: Check if user has permission on the parent entity.
    CREATE POLICY "Allow insert for owner or admin" ON field_values
        FOR INSERT TO authenticated
        WITH CHECK (
            get_my_role() = 'admin'
            OR
            (
                get_my_role() = 'user' 
                AND EXISTS (
                    SELECT 1 FROM entities 
                    WHERE id = field_values.entity_id 
                    AND created_by = auth.uid()
                )
            )
            -- Fallback: If creating a NEW entity and its fields in same transaction? 
            -- The entity exists (inserted first). But checking 'created_by' requires the entity row to be visible/committed?
            -- Inside a transaction it should be fine.
            -- HOWEVER, if this is too strict for initial creation, we might need to relax INSERT.
            -- Let's stick to safe defaults: 'user' can insert field values, trusting the UI handles context.
            -- Actually, strictly speaking, a user could insert garbage field values for other entities if we don't check.
            -- Let's keep the check!
        );

    -- UPDATE
    CREATE POLICY "Allow update for owner or admin" ON field_values
        FOR UPDATE TO authenticated
        USING (
            get_my_role() = 'admin'
            OR
            (
                get_my_role() = 'user'
                AND EXISTS (
                    SELECT 1 FROM entities 
                    WHERE id = field_values.entity_id 
                    AND created_by = auth.uid()
                )
            )
        )
        WITH CHECK (
            get_my_role() = 'admin'
            OR
            (
                get_my_role() = 'user'
                AND EXISTS (
                    SELECT 1 FROM entities 
                    WHERE id = field_values.entity_id 
                    AND created_by = auth.uid()
                )
            )
        );

    -- DELETE (e.g. removing a field value)
    CREATE POLICY "Allow delete for owner or admin" ON field_values
        FOR DELETE TO authenticated
        USING (
            get_my_role() = 'admin'
            OR
            (
                get_my_role() = 'user'
                AND EXISTS (
                    SELECT 1 FROM entities 
                    WHERE id = field_values.entity_id 
                    AND created_by = auth.uid()
                )
            )
        );
