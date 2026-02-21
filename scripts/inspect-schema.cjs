
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSchema() {
    console.log('--- Entity Types ---');
    const { data: types, error: typesError } = await supabase
        .from('entity_types')
        .select('*');
    if (typesError) console.error(typesError);
    else console.table(types);

    console.log('\n--- Field Schemas ---');
    const { data: schemas, error: schemasError } = await supabase
        .from('field_schemas')
        .select('*');
    if (schemasError) console.error(schemasError);
    else console.table(schemas);
}

inspectSchema();
