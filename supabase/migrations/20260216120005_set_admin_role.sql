
-- Update the admin user's role to 'admin'
UPDATE user_profiles
SET role = 'admin'
WHERE email = 'admin@admin.hu';

-- Optional: If you want to create a manager user later, you would use:
-- UPDATE user_profiles SET role = 'manager' WHERE email = 'manager@example.com';
