-- Fix RLS policies to prevent User from deleting Entities
-- DATE: 2026-02-14

-- 1. DROP ALL existing policies on entities to be safe
DROP POLICY IF EXISTS "Allow view for all authenticated" ON entities;
DROP POLICY IF EXISTS "Allow insert for admin and user" ON entities;
DROP POLICY IF EXISTS "Allow update for owner or admin" ON entities;
DROP POLICY IF EXISTS "Allow delete for admin" ON entities;
-- Also drop any old/incorrectly named policies that might have slipped in
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON entities;
DROP POLICY IF EXISTS "Allow update for admin" ON entities;
DROP POLICY IF EXISTS "Allow update for admin and user" ON entities;

-- 2. DROP ALL existing policies on field_values
DROP POLICY IF EXISTS "Allow view for all authenticated" ON field_values;
DROP POLICY IF EXISTS "Allow insert for owner or admin" ON field_values;
DROP POLICY IF EXISTS "Allow update for owner or admin" ON field_values;
DROP POLICY IF EXISTS "Allow delete for owner or admin" ON field_values;
-- Also drop any old/incorrectly named policies
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON field_values;
DROP POLICY IF EXISTS "Allow insert for admin and user" ON field_values;
DROP POLICY IF EXISTS "Allow update for admin" ON field_values;
DROP POLICY IF EXISTS "Allow update for admin and user" ON field_values;
DROP POLICY IF EXISTS "Allow delete for admin" ON field_values;
DROP POLICY IF EXISTS "Allow delete for admin and user" ON field_values;


-- 3. RE-APPLY Correct Policies for Entities

-- SELECT: Everyone can view
CREATE POLICY "Allow view for all authenticated" ON entities
    FOR SELECT TO authenticated
    USING (true);

-- INSERT: Admins and Users
CREATE POLICY "Allow insert for admin and user" ON entities
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL); 
    -- We trust 'created_by' default or trigger, AND basic auth check. 
    -- More specific role check is good but 'user' and 'admin' are the only roles for now.

-- UPDATE: Admin OR Owner
CREATE POLICY "Allow update for owner or admin" ON entities
    FOR UPDATE TO authenticated
    USING (
        (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin' 
        OR 
        created_by = auth.uid()
    )
    WITH CHECK (
        (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin' 
        OR 
        created_by = auth.uid()
    );

-- DELETE: Admins ONLY
CREATE POLICY "Allow delete for admin" ON entities
    FOR DELETE TO authenticated
    USING (
        (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
    );


-- 4. RE-APPLY Correct Policies for Field Values

-- SELECT
CREATE POLICY "Allow view for all authenticated" ON field_values
    FOR SELECT TO authenticated
    USING (true);

-- INSERT: Owner of parent Entity OR Admin
CREATE POLICY "Allow insert for owner or admin" ON field_values
    FOR INSERT TO authenticated
    WITH CHECK (
        (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
        OR
        EXISTS (
            SELECT 1 FROM entities 
            WHERE id = field_values.entity_id 
            AND created_by = auth.uid()
        )
    );

-- UPDATE: Owner of parent Entity OR Admin
CREATE POLICY "Allow update for owner or admin" ON field_values
    FOR UPDATE TO authenticated
    USING (
        (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
        OR
        EXISTS (
            SELECT 1 FROM entities 
            WHERE id = field_values.entity_id 
            AND created_by = auth.uid()
        )
    )
    WITH CHECK (
        (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
        OR
        EXISTS (
            SELECT 1 FROM entities 
            WHERE id = field_values.entity_id 
            AND created_by = auth.uid()
        )
    );

-- DELETE: Owner of parent Entity OR Admin (Field Values can be deleted by owner)
CREATE POLICY "Allow delete for owner or admin" ON field_values
    FOR DELETE TO authenticated
    USING (
        (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
        OR
        EXISTS (
            SELECT 1 FROM entities 
            WHERE id = field_values.entity_id 
            AND created_by = auth.uid()
        )
    );
