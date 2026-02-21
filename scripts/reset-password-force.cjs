const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error('❌ Missing URL or Key in .env');
    console.log('URL:', supabaseUrl);
    console.log('Key:', serviceKey ? 'Present' : 'Missing');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function resetPassword() {
    const email = 'admin@alapp.test'; // Using the admin user
    const newPassword = 'password123';

    console.log(`🔄 Attempting to reset password for: ${email}`);
    console.log(`📡 URL: ${supabaseUrl}`);

    // Check if user exists first to verify connection
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
        console.error('❌ Connection/Auth Error (List Users):');
        console.error(JSON.stringify(listError, null, 2));
        return;
    }

    const user = users.users.find(u => u.email === email);

    if (!user) {
        console.error(`❌ User ${email} not found in database.`);
        console.log('Available users:');
        users.users.forEach(u => console.log(` - ${u.email}`));
        return;
    }

    console.log(`✅ User found (ID: ${user.id}). Updating password...`);

    const { data, error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        { password: newPassword }
    );

    if (updateError) {
        console.error('❌ Failed to update password:', updateError);
    } else {
        console.log('✅ PASSWORD RESET SUCCESSFUL!');
        console.log(`📧 Email: ${email}`);
        console.log(`🔑 New Password: ${newPassword}`);
        console.log('---------------------------------------------------');
        console.log('Please try logging in with these credentials now.');
    }
}

resetPassword();
