import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
    const corsHeaders = getCorsHeaders(req);
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const body = await req.json();
        const { start, end } = body;

        // Validate date inputs
        if (start && isNaN(new Date(start).getTime())) {
            return new Response(
                JSON.stringify({ error: 'Invalid start date' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            );
        }
        if (end && isNaN(new Date(end).getTime())) {
            return new Response(
                JSON.stringify({ error: 'Invalid end date' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            );
        }

        const serviceAccountStr = Deno.env.get('GOOGLE_SERVICE_ACCOUNT');
        const calendarId = Deno.env.get('GOOGLE_CALENDAR_ID'); // e.g. organization@group.calendar.google.com

        if (!serviceAccountStr || !calendarId) {
            throw new Error('Missing GOOGLE_SERVICE_ACCOUNT or GOOGLE_CALENDAR_ID env vars');
        }

        const serviceAccount = JSON.parse(serviceAccountStr);
        const token = await getAccessToken(serviceAccount, ['https://www.googleapis.com/auth/calendar.readonly']);

        // Fetch Events
        const timeMin = start ? new Date(start).toISOString() : new Date().toISOString();
        const timeMax = end ? new Date(end).toISOString() : undefined;

        let url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?singleEvents=true&orderBy=startTime&timeMin=${timeMin}`;
        if (timeMax) url += `&timeMax=${timeMax}`;

        const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await res.json();
        if (!res.ok) {
            throw new Error(`Calendar API Failed: ${JSON.stringify(data)}`);
        }

        // Transform for Frontend (React Big Calendar format or similar)
        const events = (data.items || []).map(item => ({
            id: item.id,
            title: item.summary,
            start: item.start.dateTime || item.start.date, // dateTime for timed, date for all-day
            end: item.end.dateTime || item.end.date,
            allDay: !item.start.dateTime,
            description: item.description,
            location: item.location
        }));

        return new Response(
            JSON.stringify({ events }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
    }
});

// Duplicated helper for now as shared modules config requires deno.json setup which we haven't verified.
// In production, use a shared import.
async function getAccessToken(serviceAccount, scopes) {
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + 3600;

    const pemHeader = "-----BEGIN PRIVATE KEY-----";
    const pemFooter = "-----END PRIVATE KEY-----";
    const pemContents = serviceAccount.private_key.substring(
        pemHeader.length,
        serviceAccount.private_key.length - pemFooter.length - 1
    ).replace(/\n/g, '');

    const binaryDerString = atob(pemContents);
    const binaryDer = new Uint8Array(binaryDerString.length);
    for (let i = 0; i < binaryDerString.length; i++) {
        binaryDer[i] = binaryDerString.charCodeAt(i);
    }

    const key = await crypto.subtle.importKey(
        "pkcs8",
        binaryDer.buffer,
        {
            name: "RSASSA-PKCS1-v1_5",
            hash: "SHA-256",
        },
        false,
        ["sign"]
    );

    const header = { alg: "RS256", typ: "JWT" };
    const claimSet = {
        iss: serviceAccount.client_email,
        scope: scopes.join(' '),
        aud: "https://oauth2.googleapis.com/token",
        exp: exp,
        iat: iat,
    };

    const sHeader = btoa(JSON.stringify(header)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const sClaim = btoa(JSON.stringify(claimSet)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    const signature = await crypto.subtle.sign(
        "RSASSA-PKCS1-v1_5",
        key,
        new TextEncoder().encode(sHeader + "." + sClaim)
    );

    const sSignature = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    const jwt = `${sHeader}.${sClaim}.${sSignature}`;

    const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`
    });

    const data = await res.json();
    return data.access_token;
}
