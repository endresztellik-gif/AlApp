// import { createcb } from "https://deno.land/x/djwt@v2.8/mod.ts"; // Simplified access often uses google-auth-library or just constructing JWT manually if no lib

// For simplicity in Edge Functions, we often use a lightweight JWT creation or fetch the token.
// However, google-auth-library is Node.js based. In Deno, we can use "service-account" libs or robust styling.
// Let's use a simple helper approach for Deno.

export { getCorsHeaders, corsHeaders } from "../_shared/cors.ts";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getGoogleAccessToken(serviceAccountEmail: string, privateKey: string, scopes: string[]) {
    // Improved JWT signing for Deno Edge Functions
    // We need to import a crypto library or use Web Crypto API

    // NOTE: For production robustness, we should use a library like 'djwt' or similar
    // But for this implementation, let's assume we have the service account JSON
    // and we exchange it for a token.

    // Actually, let's try to use the specific 'googleapis' for Deno if available, 
    // OR just implement the JWT flow using standard Web Crypto if we want zero dependencies.

    // To keep it simple and reliable, we'll return a placeholder or use a known Deno module.
    // 'service_account' module for Deno is good.

    // For now, let's define the structure and allow the specific functions to implement the logic
    // or export a helper if we have a shared folder. 
    // Since we don't have a shared folder mechanism easily in Supabase allow-list without config,
    // we might duplicate this or put it in a shared `_shared` folder if configured.
    // Standard Supabase pattern: `supabase/functions/_shared`

    return "MOCK_TOKEN"; // Placeholder until we have the 'service_account' mod imported correctly
}

// REAL IMPLEMENTATION using Web Crypto for JWT (RS256)
function pem2binary(pem: string) {
    const b64 = pem
        .replace(/-----BEGIN PRIVATE KEY-----/g, '')
        .replace(/-----END PRIVATE KEY-----/g, '')
        .replace(/\n/g, '');
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

export async function getServiceAccountToken(serviceAccount: { private_key: string; client_email: string; [key: string]: unknown }, scopes: string[]) {
    const importKey = await crypto.subtle.importKey(
        "pkcs8",
        pem2binary(serviceAccount.private_key),
        {
            name: "RSASSA-PKCS1-v1_5",
            hash: "SHA-256",
        },
        false,
        ["sign"]
    );

    const header = { alg: "RS256", typ: "JWT" };
    const now = Math.floor(Date.now() / 1000);
    const claim = {
        iss: serviceAccount.client_email,
        scope: scopes.join(" "),
        aud: "https://oauth2.googleapis.com/token",
        exp: now + 3600,
        iat: now,
    };

    const sHeader = btoa(JSON.stringify(header));
    const sClaim = btoa(JSON.stringify(claim));
    const data = new TextEncoder().encode(sHeader + "." + sClaim);

    const signature = await crypto.subtle.sign(
        "RSASSA-PKCS1-v1_5",
        importKey,
        data
    );

    const sSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    // Correct URL Safety
    const urlSafe = (s: string) => s.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const finalJwt = `${urlSafe(sHeader)}.${urlSafe(sClaim)}.${sSignature}`;

    const params = new URLSearchParams();
    params.append('grant_type', 'urn:ietf:params:oauth:grant-type:jwt-bearer');
    params.append('assertion', finalJwt);

    const res = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params
    });

    const tokenData = await res.json();
    return tokenData.access_token;
}
