const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkAnon() {
    console.log("Checking ANON connection...");
    const { data, error } = await supabase.from('entity_types').select('count', { count: 'exact', head: true });
    if (error) {
        console.error("❌ ANON Failed:", error.message);
    } else {
        console.log("✅ ANON Success. URL is correct.");
    }
}
checkAnon();
