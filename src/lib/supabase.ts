import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Capture recovery intent BEFORE createClient processes and clears the URL hash
if (typeof window !== 'undefined' && window.location.hash.includes('type=recovery')) {
    sessionStorage.setItem('recovery_pending', '1')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: sessionStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    }
})
