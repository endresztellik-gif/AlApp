
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
    console.log('Fetching Roles...');
    const { data: roles, error } = await supabase
        .from('user_roles') // Adjust table name if needed, maybe 'roles'
        .select('*');

    if (error) {
        console.log('Error fetching user_roles, trying "roles"...');
        const { data: roles2, error: error2 } = await supabase.from('roles').select('*');
        if (error2) console.error(error2);
        else console.table(roles2);
    } else {
        console.table(roles);
    }
}

run();
