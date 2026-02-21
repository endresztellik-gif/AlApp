import { supabase } from '@/lib/supabase';

export async function fixVehicleTypes() {
    console.log("Starting vehicle types fix...");
    const results = [];

    // 1. Define types to check/insert
    const types = [
        { name: 'Személyautó', module: 'vehicles', icon: 'car' },
        { name: 'Teherautó', module: 'vehicles', icon: 'truck' },
        { name: 'Traktor', module: 'vehicles', icon: 'tractor' },
        { name: 'Utánfutó', module: 'vehicles', icon: 'trailer' },
        { name: 'Hajó', module: 'vehicles', icon: 'ship' }
    ];

    for (const t of types) {
        // Check if exists
        const { data: existing } = await supabase.from('entity_types').select('id').eq('name', t.name).eq('module', 'vehicles').single();

        let typeId = existing?.id;

        if (!existing) {
            console.log(`Creating type: ${t.name}`);
            const { data: created, error } = await supabase.from('entity_types').insert(t).select('id').single();
            if (error) {
                console.error(`Failed to create ${t.name}`, error);
                results.push(`Failed to create ${t.name}: ${error.message}`);
                continue;
            }
            typeId = created.id;
            results.push(`Created type: ${t.name}`);
        } else {
            // results.push(`Type exists: ${t.name}`);
        }

        if (!typeId) continue;

        // 2. Insert Schemas if needed (Car/Truck/Trailer)
        if (t.name === 'Személyautó' || t.name === 'Teherautó') {
            await ensureSchema(typeId, t.name, [
                { field_name: 'Rendszám', field_key: 'license_plate', field_type: 'text', is_required: true, display_order: 1 },
                { field_name: 'Forgalmi eng. száma', field_key: 'registration_number', field_type: 'text', is_required: false, display_order: 2 },
                { field_name: 'Forgalmi eng. lejárata', field_key: 'registration_expiry', field_type: 'date_expiry', is_required: false, display_order: 3 },
                { field_name: 'Műszaki vizsga lejárata', field_key: 'inspection_expiry', field_type: 'date_expiry', is_required: false, display_order: 4 },
                { field_name: 'Utolsó javítás ideje', field_key: 'last_repair_date', field_type: 'date', is_required: false, display_order: 5 },
                { field_name: 'Állapot', field_key: 'status', field_type: 'select', is_required: false, display_order: 6, select_options: '["aktív", "javításra vár", "selejtezett"]' }
            ], results);
        } else if (t.name === 'Utánfutó') {
            await ensureSchema(typeId, t.name, [
                { field_name: 'Rendszám', field_key: 'license_plate', field_type: 'text', is_required: true, display_order: 1 },
                { field_name: 'Forgalmi eng. száma', field_key: 'registration_number', field_type: 'text', is_required: false, display_order: 2 },
                { field_name: 'Forgalmi eng. lejárata', field_key: 'registration_expiry', field_type: 'date_expiry', is_required: false, display_order: 3 }
            ], results);
        }
    }

    return results;
}

interface FieldSchemaInput {
    field_name: string;
    field_key: string;
    field_type: string;
    is_required: boolean;
    display_order: number;
    select_options?: string;
}

async function ensureSchema(typeId: string, typeName: string, schemas: FieldSchemaInput[], results: string[]) {
    // Check existing schemas
    const { data: existingSchemas } = await supabase.from('field_schemas').select('field_key').eq('entity_type_id', typeId);
    const existingKeys = new Set(existingSchemas?.map(s => s.field_key) || []);

    for (const s of schemas) {
        if (!existingKeys.has(s.field_key)) {
            console.log(`Creating field ${s.field_key} for ${typeName}`);
            const { error } = await supabase.from('field_schemas').insert({ ...s, entity_type_id: typeId });
            if (error) {
                results.push(`Failed to create field ${s.field_name} for ${typeName}: ${error.message}`);
            } else {
                results.push(`Created field ${s.field_name} for ${typeName}`);
            }
        }
    }
}
