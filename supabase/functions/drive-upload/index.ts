import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
    const corsHeaders = getCorsHeaders(req);
    // 1. Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // 2. Parse request
        const formData = await req.formData();
        const file = formData.get('file'); // File object
        const folderName = formData.get('folderName') || 'AlApp_General';
        const description = formData.get('description') || '';

        if (!file || !(file instanceof File)) {
            throw new Error('No file uploaded');
        }

        // Input validation: file size limit (50MB)
        const MAX_FILE_SIZE = 50 * 1024 * 1024;
        if (file.size > MAX_FILE_SIZE) {
            return new Response(
                JSON.stringify({ error: `File too large. Maximum size is 50MB, got ${(file.size / 1024 / 1024).toFixed(1)}MB` }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            );
        }

        // Input validation: allowed MIME types
        const ALLOWED_MIME_TYPES = [
            'application/pdf',
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain', 'text/csv',
        ];
        if (file.type && !ALLOWED_MIME_TYPES.includes(file.type)) {
            return new Response(
                JSON.stringify({ error: `File type '${file.type}' is not allowed.` }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            );
        }

        // 3. Get Google Access Token (via OAuth Refresh Token)
        const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
        const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
        const refreshToken = Deno.env.get('GOOGLE_REFRESH_TOKEN');

        if (!clientId || !clientSecret || !refreshToken) {
            throw new Error('Missing GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, or GOOGLE_REFRESH_TOKEN');
        }

        const token = await getAccessTokenFromRefreshToken(clientId, clientSecret, refreshToken);

        // 4. Upload to Drive (Resumable upload recommended but simple multipart works for small files)
        // We'll use simple multipart upload for reliability in this demo context.

        // Metadata part
        const metadata: { name: string; description: FormDataEntryValue | string; parents: string[] } = {
            name: file.name,
            description: description,
            parents: [], // We might need to find/create the folder ID first!
        };

        // Find folder
        const folderId = await findOrCreateFolder(token, folderName);
        if (folderId) {
            metadata.parents = [folderId];
        }

        // Prepare Multipart Body
        const boundary = 'foo_bar_baz';
        const delimiter = `\r\n--${boundary}\r\n`;
        const closeDelimiter = `\r\n--${boundary}--`;

        const body = delimiter +
            'Content-Type: application/json\r\n\r\n' +
            JSON.stringify(metadata) +
            delimiter +
            `Content-Type: ${file.type}\r\n` +
            'Content-Transfer-Encoding: base64\r\n\r\n' +
            base64ArrayBuffer(await file.arrayBuffer()) +
            closeDelimiter;

        const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': `multipart/related; boundary=${boundary}`
            },
            body: body
        });

        const data = await res.json();
        if (!res.ok) {
            throw new Error(`Google Upload Failed: ${JSON.stringify(data)}`);
        }

        // Return success
        return new Response(
            JSON.stringify({
                id: data.id,
                name: data.name,
                mimeType: data.mimeType,
                webViewLink: data.webViewLink,
                webContentLink: data.webContentLink
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error: unknown) {
        return new Response(
            JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
    }
});

// --- HELPER FUNCTIONS ---

function base64ArrayBuffer(arrayBuffer: ArrayBuffer) {
    let base64 = ''
    const encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
    const bytes = new Uint8Array(arrayBuffer)
    const byteLength = bytes.byteLength
    const byteRemainder = byteLength % 3
    const mainLength = byteLength - byteRemainder
    let a, b, c, d
    let chunk
    // Main loop dealing with 3-byte chunks
    for (let i = 0; i < mainLength; i = i + 3) {
        chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2]
        a = (chunk & 16515072) >> 18
        b = (chunk & 258048) >> 12
        c = (chunk & 4032) >> 6
        d = chunk & 63
        base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d]
    }
    // Deal with the remaining bytes and padding
    if (byteRemainder == 1) {
        chunk = bytes[mainLength]
        a = (chunk & 252) >> 2
        b = (chunk & 3) << 4
        base64 += encodings[a] + encodings[b] + '=='
    } else if (byteRemainder == 2) {
        chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1]
        a = (chunk & 64512) >> 10
        b = (chunk & 1008) >> 4
        c = (chunk & 15) << 2
        base64 += encodings[a] + encodings[b] + encodings[c] + '='
    }
    return base64
}

async function getAccessTokenFromRefreshToken(clientId: string, clientSecret: string, refreshToken: string) {
    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('refresh_token', refreshToken);
    params.append('grant_type', 'refresh_token');

    const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
    });

    const data = await res.json();
    if (!res.ok) {
        throw new Error(`Failed to refresh token: ${JSON.stringify(data)}`);
    }
    return data.access_token;
}

async function findOrCreateFolder(token: string, folderName: string) {
    // Sanitize folder name: remove quotes and special chars to prevent query injection
    const safeFolderName = folderName.replace(/['"\\]/g, '').substring(0, 100);
    // 1. Search
    const q = `mimeType='application/vnd.google-apps.folder' and name='${safeFolderName}' and trashed=false`;
    const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();

    if (data.files && data.files.length > 0) {
        return data.files[0].id;
    }

    // 2. Create
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: safeFolderName,
            mimeType: 'application/vnd.google-apps.folder'
        })
    });
    const createData = await createRes.json();
    return createData.id;
}
