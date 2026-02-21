
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
    console.log('Checking Personnel Types...');
    const { data, error } = await supabase
        .from('entity_types')
        .select('*')
        .eq('module', 'personnel');

    if (error) console.error(error);
    else console.log(JSON.stringify(data, null, 2));
}

run();
