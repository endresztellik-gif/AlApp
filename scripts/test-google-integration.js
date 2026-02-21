
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Using service role to bypass RLS for test setup/cleanup if needed, but mainly to invoke functions.

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCalendarSync() {
    console.log('\n📅 Testing Calendar Sync...');
    const now = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(now.getMonth() + 1);

    const { data, error } = await supabase.functions.invoke('calendar-sync', {
        body: {
            start: now.toISOString(),
            end: nextMonth.toISOString()
        }
    });

    if (error) {
        console.error('❌ Calendar Sync Failed:', error);
    } else {
        console.log('✅ Calendar Sync Success!');
        console.log(`   Found ${data.events ? data.events.length : 0} events.`);
        if (data.events && data.events.length > 0) {
            console.log('   Sample event:', data.events[0].summary);
        }
    }
}

async function testDriveUpload() {
    console.log('\nBg Testing Drive Upload...');

    // Create a dummy file
    const dummyContent = 'Hello from automated test script!';
    const fileName = `test_upload_${Date.now()}.txt`;
    const folderName = 'AlApp_Adatok'; // Using the folder actually shared by the user

    // In Node.js, we need to construct FormData manually for file uploads if standard FormData isn't fully supported or quirky in Edge Function invocation context from Node.
    // However, Supabase Edge Functions expect a standard Request with FormData.
    // To keep it simple in a Node script, we'll try to use the 'form-data' library pattern if available, or just construct a simple multipart body manually if needed.
    // But supabase-js 'invoke' with FormData in Node can be tricky.
    // Let's rely on the fact that we can send a Blob/File compatible object.

    // Actually, making a raw fetch call might be easier to debug for multipart in Node.

    const formData = new FormData();
    const file = new Blob([dummyContent], { type: 'text/plain' });
    formData.append('file', file, fileName);
    formData.append('folderName', folderName);
    formData.append('description', 'Automated test upload');

    const { data, error } = await supabase.functions.invoke('drive-upload', {
        body: formData,
    });

    if (error) {
        console.error('❌ Drive Upload Failed:', error);
        if (error.context && typeof error.context.text === 'function') {
            try {
                const body = await error.context.text();
                console.error('   Error Body:', body);
            } catch (e) {
                console.error('   Could not read error body');
            }
        }
    } else {
        console.log('✅ Drive Upload Success!');
        console.log('   File ID:', data.id);
        console.log('   View Link:', data.webViewLink);
    }
}

async function main() {
    console.log('🚀 Starting Google Integration Test...');

    await testCalendarSync();

    // Note: Drive upload test might fail in Node environment if FormData/Blob polyfills aren't perfect in standard Node 18+,
    // but let's try. If it fails technically, we mostly rely on Calendar.
    await testDriveUpload();
}

main();
