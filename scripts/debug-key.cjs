
const jwt = require('jsonwebtoken'); // You might not have this installed, let's try basic base64 decode if not
require('dotenv').config();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('--- Debugging Supabase Key ---');
console.log(`URL: ${url}`);
if (!key) {
    console.error('Key is missing');
    process.exit(1);
}
console.log(`Key length: ${key.length}`);

// Simple JWT decode without verification
try {
    const parts = key.split('.');
    if (parts.length !== 3) {
        console.error('Key is not a valid JWT (does not have 3 parts)');
    } else {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        console.log('---/ JWT Payload /---');
        console.log(`Role: ${payload.role}`);
        console.log(`Exp: ${new Date(payload.exp * 1000).toISOString()}`);
        console.log(`Ref (Project ID): ${payload.ref || 'N/A'}`);
        console.log(`Iss: ${payload.iss}`);

        // Extract project ID from URL
        // https://mgducjqbzqcmrzcsklmn.supabase.co
        const urlRef = url ? url.match(/https:\/\/([^.]+)\./)?.[1] : null;
        console.log(`URL Ref: ${urlRef}`);

        if (urlRef && payload.ref && urlRef !== payload.ref) {
            console.error('MISMATCH! Key belongs to a different project than the URL.');
        } else if (urlRef && payload.ref && urlRef === payload.ref) {
            console.log('MATCH! Key project ID matches URL.');
        }
    }
} catch (e) {
    console.error('Failed to decode JWT:', e.message);
}
