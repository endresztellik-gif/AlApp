
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const serviceRoleKey = envConfig.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing keys');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function createTestUser() {
    const email = 'test_frontend@test.com';
    const password = 'password123';

    console.log(`Creating user: ${email}...`);

    // Check if exists
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const existing = users.find(u => u.email === email);

    if (existing) {
        console.log('User already exists, updating password...');
        const { error: updateError } = await supabase.auth.admin.updateUserById(existing.id, { password: password, email_confirm: true });
        if (updateError) console.error('Update failed:', updateError);
        else console.log('Password updated.');
        return;
    }

    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true
    });

    if (error) {
        console.error('Error creating user:', error);
    } else {
        console.log('User created successfully:', data.user.id);
    }
}

createTestUser();
