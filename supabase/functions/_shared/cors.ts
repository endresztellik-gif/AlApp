const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:4173',
    'https://mgducjqbzqcmrzcsklmn.supabase.co',
]

export function getCorsHeaders(req?: Request): Record<string, string> {
    const origin = req?.headers.get('origin') ?? ''
    const allowed = allowedOrigins.includes(origin) ? origin : allowedOrigins[0]
    return {
        'Access-Control-Allow-Origin': allowed,
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }
}

// Keep backwards-compatible static export for existing code that doesn't pass req
export const corsHeaders = {
    'Access-Control-Allow-Origin': 'http://localhost:5173',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
