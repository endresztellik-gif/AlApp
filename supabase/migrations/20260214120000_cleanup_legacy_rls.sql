-- Cleanup Legacy RLS Policies to fix security holes
-- content: Drop old policies that use snake_case names (e.g. admin_all_entities)
-- DATE: 2026-02-14

-- 1. Entities Table
DROP POLICY IF EXISTS "admin_all_entities" ON entities;
DROP POLICY IF EXISTS "reader_select_entities" ON entities;
DROP POLICY IF EXISTS "user_select_own_entities" ON entities;
DROP POLICY IF EXISTS "user_update_own_entities" ON entities;
DROP POLICY IF EXISTS "all_authenticated_select" ON entities;

-- 2. Field Values Table (if any legacy exists there too)
DROP POLICY IF EXISTS "admin_all_field_values" ON field_values;
DROP POLICY IF EXISTS "reader_select_field_values" ON field_values;
DROP POLICY IF EXISTS "user_select_own_field_values" ON field_values;
DROP POLICY IF EXISTS "user_update_own_field_values" ON field_values;

-- NOTE: The new policies created in '20260214_fix_rls_delete.sql' use sentence casing
-- (e.g. "Allow delete for admin"). These will remain active and secure.
