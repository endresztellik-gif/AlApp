-- Create a database function to handle user invitations
-- This is called from the frontend and uses the service role to invite users

CREATE OR REPLACE FUNCTION invite_user_by_admin(
    p_email TEXT,
    p_full_name TEXT,
    p_role TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER -- Run with the privileges of the function owner (postgres)
SET search_path = public
AS $$
DECLARE
    v_calling_user_id UUID;
    v_calling_user_role TEXT;
    v_result JSON;
BEGIN
    -- Get the calling user's ID from auth.uid()
    v_calling_user_id := auth.uid();

    IF v_calling_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Check if the calling user is an admin
    SELECT role INTO v_calling_user_role
    FROM user_profiles
    WHERE id = v_calling_user_id;

    IF v_calling_user_role IS NULL THEN
        RAISE EXCEPTION 'User profile not found';
    END IF;

    IF v_calling_user_role != 'admin' THEN
        RAISE EXCEPTION 'Only admins can invite users';
    END IF;

    -- Validate role
    IF p_role NOT IN ('admin', 'reader', 'user') THEN
        RAISE EXCEPTION 'Invalid role: %', p_role;
    END IF;

    -- Log the invitation attempt
    INSERT INTO audit_logs (
        user_id,
        action,
        table_name,
        new_values
    ) VALUES (
        v_calling_user_id,
        'invite_user',
        'auth.users',
        jsonb_build_object(
            'email', p_email,
            'full_name', p_full_name,
            'role', p_role
        )
    );

    -- Return success with instructions to use Supabase Dashboard
    -- Note: PostgreSQL functions cannot call Supabase Auth API directly
    -- This function serves as authorization check and audit logging
    v_result := json_build_object(
        'success', true,
        'message', 'Admin authorization confirmed. Please use Supabase Dashboard to send invite.',
        'email', p_email,
        'full_name', p_full_name,
        'role', p_role
    );

    RETURN v_result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION invite_user_by_admin TO authenticated;

-- Add comment
COMMENT ON FUNCTION invite_user_by_admin IS 'Validates admin permissions and logs invitation attempts. Actual invitation must be sent via Supabase Auth API.';
