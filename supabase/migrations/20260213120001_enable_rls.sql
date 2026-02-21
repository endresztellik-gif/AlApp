-- Enable RLS on tables
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_schemas ENABLE ROW LEVEL SECURITY;

-- 1. Entity Types & Field Schemas (Metadata)
-- Visible to all authenticated users (needed for forms)
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON entity_types;
CREATE POLICY "Enable read access for authenticated users" ON entity_types
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON field_schemas;
CREATE POLICY "Enable read access for authenticated users" ON field_schemas
    FOR SELECT TO authenticated
    USING (true);

-- Only Admin can edit metadata (future proofing, though currently maybe manual DB edits)
-- For now, we'll leave write policies for these undefined for non-admins (default deny), 
-- or create an admin-only policy if we had an admin check. 
-- Since we are in dev, maybe we allow all authenticated to insert/update metadata? 
-- No, metadata is usually static or admin-managed. Let's keep it read-only for normal users.

-- 2. Entities & Field Values (Data)
-- For now, allow ALL authenticated users to SELECT, INSERT, UPDATE, DELETE.
-- This effectively restores the "Reader" and "User" access but ensures they are at least logged in.
-- Later we will refine this to check `responsible_user_id` or roles.

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON entities;
CREATE POLICY "Enable all access for authenticated users" ON entities
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON field_values;
CREATE POLICY "Enable all access for authenticated users" ON field_values
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);
