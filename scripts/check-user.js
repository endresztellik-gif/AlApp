
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env');

// Read directly to avoid process.cwd() issues
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const serviceRoleKey = envConfig.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase URL or Service Role Key in .env');
    process.exit(1);
}

console.log('Supabase URL:', supabaseUrl);
console.log('Service Role Key Length:', serviceRoleKey.length);
console.log('Service Role Key Preview:', serviceRoleKey.substring(0, 10) + '...' + serviceRoleKey.substring(serviceRoleKey.length - 10));

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function checkUser() {
    const email = 'admin@admin.hu';

    console.log(`Checking for user: ${email}...`);

    // List users to find the specific one (admin API)
    const { data, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.error('Error listing users:', error);
        return;
    }

    const user = data.users.find(u => u.email === email);

    if (user) {
        console.log('User found:');
        console.log(`- ID: ${user.id}`);
        console.log(`- Email: ${user.email}`);
        console.log(`- Confirmed: ${!!user.email_confirmed_at}`);
        console.log(`- Last Sign In: ${user.last_sign_in_at}`);
        console.log(`- Role: ${user.role}`);

        // Check profile
        const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profileError) {
            console.error('Error fetching profile:', profileError);
            console.error('Profile query check - ensure table permissions or RLS are correct for Service Role.');
        } else {
            console.log('Profile found:', profile);
        }

    } else {
        console.error('User NOT found!');
    }
}

checkUser();
