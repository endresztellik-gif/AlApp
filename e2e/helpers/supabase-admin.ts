/**
 * Supabase admin helper – service role key-vel, RLS bypass.
 * Csak teszt cleanup-hoz használatos!
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL     = process.env.VITE_SUPABASE_URL ?? '';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
});

/** Töröl minden 'E2E_%' prefixű emlékeztetőt (service role bypasses RLS) */
export async function cleanupE2EReminders(_userId?: string) {
    const { error } = await adminClient
        .from('personal_reminders')
        .delete()
        .like('title', 'E2E_%');
    if (error) throw new Error(`cleanupE2EReminders failed: ${error.message}`);
}

/** Visszaadja az user_profiles.id-ját az email alapján */
export async function getUserIdByEmail(email: string): Promise<string | null> {
    const { data, error } = await adminClient
        .from('user_profiles')
        .select('id')
        .eq('email', email)
        .limit(1)
        .single();
    if (error) return null;
    return data?.id ?? null;
}
