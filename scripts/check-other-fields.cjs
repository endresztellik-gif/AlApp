
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
    console.log('Logging in...');
    await supabase.auth.signInWithPassword({
        email: 'admin@admin.hu',
        password: 'admin1234'
    });

    console.log('Fetching "Egyéb" type ID...');
    const { data: type } = await supabase
        .from('entity_types')
        .select('id')
        .eq('name', 'Egyéb')
        .eq('module', 'personnel')
        .single();

    if (!type) {
        console.error('Egyéb type not found');
        return;
    }

    console.log(`Fetching fields for type ID: ${type.id}`);
    const { data: fields, error } = await supabase
        .from('field_schemas')
        .select('*')
        .eq('entity_type_id', type.id)
        .order('display_order');

    if (error) console.error(error);
    else console.log(JSON.stringify(fields, null, 2));
}

run();
