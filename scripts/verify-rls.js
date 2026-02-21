
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseAnonKey = envConfig.VITE_SUPABASE_ANON_KEY;
const serviceKey = envConfig.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !serviceKey) {
    console.error('❌ Missing Supabase URL, Anon Key, or Service Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const serviceClient = createClient(supabaseUrl, serviceKey);

async function restoreAdmin(userId) {
    const { error } = await serviceClient
        .from('user_profiles')
        .update({ role: 'admin' })
        .eq('id', userId);

    if (error) console.error('❌ Failed to restore admin:', error.message);
    else console.log('✅ Admin role restored via Service Key.');
}

async function verifyRLS() {
    console.log('🔄 Verifying RLS Schema & Policies...');

    // 1. Sign in
    const { data: { session }, error: loginError } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'password123'
    });

    if (loginError) {
        console.error('❌ Login failed:', loginError.message);
        return;
    }
    console.log('✅ Logged in as test user:', session.user.id);

    // Check user profile role
    let { data: profile } = await supabase.from('user_profiles').select('role').eq('id', session.user.id).single();
    console.log('👤 User Role (Initial):', profile ? profile.role : 'Unknown');

    // DEMOTE TO USER FOR TESTING if admin
    if (profile && profile.role === 'admin') {
        console.log('📉 Temporarily demoting to "user" to test restrictions...');
        // Use service client to ensure we can change it back later if needed, 
        // but here we are testing if "user" can change their own role? No, likely not allowed.
        // So use service client to demote to be safe.
        const { error: demoteError } = await serviceClient
            .from('user_profiles')
            .update({ role: 'user' })
            .eq('id', session.user.id);

        if (demoteError) {
            console.error('❌ Could not demote user:', demoteError.message);
        } else {
            console.log('✅ User demoted to "user" for testing.');
        }
    }

    // 2. Check if 'entities' table has 'created_by' column
    const { data: checkData, error: checkError } = await supabase
        .from('entities')
        .select('id, created_by')
        .limit(1);

    if (checkError) {
        if (checkError.message.includes('does not exist') || checkError.code === '42703') {
            console.log('🚨 MIGRATION PENDING: column "created_by" does not exist on "entities" table.');
            // Try to restore admin before exiting
            await restoreAdmin(session.user.id);
            process.exit(0);
        } else {
            console.error('❌ Error checking column created_by:', checkError.message);
        }
    } else {
        if (checkData.length > 0 && checkData[0].hasOwnProperty('created_by')) {
            console.log('✅ Schema OK: "created_by" column exists.');
        } else {
            console.log('ℹ️  Table empty or check passed implicitly.');
        }
    }

    // 3. Try to create an entity
    const testEntity = {
        display_name: 'RLS Test Column Check',
        module: 'equipment',
        is_active: true
    };

    const { data: types } = await supabase.from('entity_types').select('id').limit(1);
    if (types && types.length) {
        testEntity.entity_type_id = types[0].id;
    }

    const { data: createdEntity, error: createError } = await supabase
        .from('entities')
        .insert(testEntity)
        .select()
        .single();

    if (createError) {
        console.error('❌ Create failed:', createError.message);
    } else {
        console.log('✅ Create successful.');

        // 4. Try to Delete (Admin only check)
        // Now that we (hopefully) are 'user', this should fail.
        const { error: deleteError } = await supabase
            .from('entities')
            .delete()
            .eq('id', createdEntity.id);

        if (deleteError) {
            console.log('✅ Delete BLOCKED (Correct behavior for User). Error:', deleteError.message);
        } else {
            console.log('⚠️  Delete SUCCESSFUL (Warning: User was able to delete. Policy might be loose or demotion failed).');

            // Double check role
            const { data: checkRole } = await supabase.from('user_profiles').select('role').eq('id', session.user.id).single();
            console.log('   Current Role during delete:', checkRole ? checkRole.role : 'Unknown');
        }
    }

    await restoreAdmin(session.user.id);
    console.log('🏁 Verification complete.');
}

verifyRLS();
