
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
    console.log('Logging in as admin...');
    await supabase.auth.signInWithPassword({
        email: 'admin@admin.hu',
        password: 'admin1234'
    });

    console.log('Inspecting user_profiles columns...');
    // Fetch one row to see the structure
    const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .limit(1);

    if (error) console.error(error);
    else console.log(JSON.stringify(data, null, 2));
}

run();
