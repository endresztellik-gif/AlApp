
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
    console.log('Missing variables');
    process.exit(1);
}

const supabase = createClient(url, key);

async function run() {
    try {
        const { data, error } = await supabase.from('entity_types').select('count', { count: 'exact', head: true });
        if (error) {
            console.error('Key test failed:', error.message);
        } else {
            console.log('Key is VALID! Proceeding with migration...');
            require('./scripts/extend-personnel-schema.cjs'); // Wait, create this file first?
        }
    } catch (e) {
        console.error('Error:', e.message);
    }
}

run();
