
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
    console.log('Logging in as admin...');
    await supabase.auth.signInWithPassword({
        email: 'admin@admin.hu',
        password: 'admin1234'
    });

    console.log('\n--- Equipment Types ---');
    const { data: types } = await supabase
        .from('entity_types')
        .select('*')
        .eq('module', 'equipment');
    console.log(JSON.stringify(types, null, 2));

    if (types && types.length > 0) {
        console.log('\n--- Fields for first type found ---');
        // Check fields for one of the types (e.g., Fűkasza or just the first one)
        const typeToCheck = types.find(t => t.name === 'Fűkasza') || types[0];
        console.log(`Checking fields for: ${typeToCheck.name} (${typeToCheck.id})`);

        const { data: fields } = await supabase
            .from('field_schemas')
            .select('*')
            .eq('entity_type_id', typeToCheck.id)
            .order('display_order');
        console.log(JSON.stringify(fields, null, 2));
    }
}

run();
