/**
 * Supabase admin helper – service role key-vel, RLS bypass.
 * Csak teszt cleanup-hoz használatos!
 */

const SUPABASE_URL      = process.env.VITE_SUPABASE_URL ?? '';
const SERVICE_ROLE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

async function supabaseAdminFetch(path: string, options: RequestInit = {}) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
        ...options,
        headers: {
            'apikey': SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
            ...(options.headers ?? {}),
        },
    });
    if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`Supabase admin request failed ${res.status}: ${body}`);
    }
    return res;
}

/** Töröl minden 'E2E_%' prefixű emlékeztetőt a megadott user_id-hoz */
export async function cleanupE2EReminders(userId: string) {
    await supabaseAdminFetch(
        `/personal_reminders?user_id=eq.${userId}&title=like.E2E_%`,
        { method: 'DELETE' }
    );
}

/** Visszaadja az user_profiles.id-ját az email alapján */
export async function getUserIdByEmail(email: string): Promise<string | null> {
    const res = await supabaseAdminFetch(
        `/user_profiles?email=eq.${encodeURIComponent(email)}&select=id&limit=1`
    );
    const data = await res.json() as { id: string }[];
    return data[0]?.id ?? null;
}
