
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testProfileAccess() {
    console.log('Testing Profile Access...');
    try {
        // 1. Login
        console.log('Logging in as admin@admin.hu...');
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: 'admin@admin.hu',
            password: 'admin1234',
        });

        if (authError) {
            throw new Error(`Login failed: ${authError.message}`);
        }

        console.log('Login successful. User ID:', authData.user.id);
        const token = authData.session.access_token;
        console.log('Access Token obtained:', token.substring(0, 10) + '...');

        // 2. Fetch Profile using the authenticated client (supabase instance maintains session)
        console.log('Fetching profile for user:', authData.user.id);
        const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();

        if (profileError) {
            throw new Error(`Profile fetch failed: ${profileError.message}`);
        }

        console.log('Profile fetched successfully:', profile);

    } catch (err) {
        console.error('Test failed:', err);
        process.exit(1);
    }
}

testProfileAccess();
