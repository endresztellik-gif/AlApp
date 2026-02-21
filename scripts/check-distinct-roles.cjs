
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
    console.log('Logging in as admin...');
    await supabase.auth.signInWithPassword({
        email: 'admin@admin.hu',
        password: 'admin1234'
    });

    console.log('Checking distinct roles...');
    const { data, error } = await supabase
        .from('user_profiles')
        .select('role'); // Get all roles

    if (error) {
        console.error(error);
    } else {
        const roles = [...new Set(data.map(u => u.role))];
        console.log('Distinct roles found:', roles);
    }
}

run();
