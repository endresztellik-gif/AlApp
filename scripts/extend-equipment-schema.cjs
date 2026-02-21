
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const ADMIN_EMAIL = 'admin@admin.hu';
const ADMIN_PASSWORD = 'admin1234';

const NEW_TYPES = [
    { name: 'Láncfűrész', module: 'equipment' },
    { name: 'Fűkasza', module: 'equipment' },
    { name: 'Egyéb', module: 'equipment' }
];

const NEW_FIELDS = [
    {
        field_name: 'Széria szám',
        field_key: 'serial_number',
        field_type: 'text',
        display_order: 10
    },
    {
        field_name: 'Használatba vétel dátuma',
        field_key: 'commission_date',
        field_type: 'date',
        display_order: 11
    },
    {
        field_name: 'Leltárfelelős',
        field_key: 'inventory_responsible',
        field_type: 'text',
        display_order: 12
    }
];

async function run() {
    console.log('Starting Equipment Schema Extension (Admin Login)...');

    // 1. Sign In
    const { data: { session }, error: authError } = await supabase.auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
    });

    if (authError) {
        console.error('Login failed:', authError.message);
        process.exit(1);
    }
    console.log('Logged in as admin.');

    for (const typeDef of NEW_TYPES) {
        console.log(`Processing Type: ${typeDef.name}`);

        // 1. Get or Create Entity Type
        let { data: type, error: typeError } = await supabase
            .from('entity_types')
            .select('id')
            .eq('name', typeDef.name)
            .eq('module', typeDef.module)
            .single();

        if (!type) {
            console.log(`  Creating type...`);
            const { data: newType, error: createError } = await supabase
                .from('entity_types')
                .insert(typeDef)
                .select()
                .single();

            if (createError) {
                console.error(`  Error creating type ${typeDef.name}:`, createError);
                continue;
            }
            type = newType;
        } else {
            console.log(`  Type already exists: ${type.id}`);
        }

        if (!type) continue;

        // 2. Add Fields
        for (const fieldDef of NEW_FIELDS) {
            // Check if field exists
            const { data: existingField } = await supabase
                .from('field_schemas')
                .select('id')
                .eq('entity_type_id', type.id)
                .eq('field_key', fieldDef.field_key)
                .single();

            if (existingField) {
                console.log(`  Field ${fieldDef.field_key} already exists.`);
            } else {
                console.log(`  Adding field ${fieldDef.field_key}...`);
                const { error: fieldError } = await supabase
                    .from('field_schemas')
                    .insert({
                        entity_type_id: type.id,
                        ...fieldDef,
                        is_required: false
                    });

                if (fieldError) {
                    console.error(`  Error creating field ${fieldDef.field_key}:`, fieldError);
                } else {
                    console.log(`  Success: Field ${fieldDef.field_key} added.`);
                }
            }
        }
    }

    console.log('Done.');
}

run();
