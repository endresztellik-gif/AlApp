
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const serviceRoleKey = envConfig.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing keys');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function resetPassword() {
    const email = 'admin@admin.hu';
    const newPassword = 'admin1234';

    console.log(`Resetting password for: ${email}...`);

    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    if (error) { console.error(error); return; }

    const user = users.find(u => u.email === email);
    if (!user) { console.error('User not found'); return; }

    const { data, error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        { password: newPassword }
    );

    if (updateError) {
        console.error('Error updating password:', updateError);
    } else {
        console.log('Password updated successfully for:', data.user.email);
    }
}

resetPassword();
