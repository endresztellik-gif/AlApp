import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getCorsHeaders } from "../_shared/cors.ts";

// ─────────────────────────────────────────────
// VAPID helpers (Web Crypto, no npm)
// ─────────────────────────────────────────────

function base64urlToUint8Array(b64u: string): Uint8Array {
    const pad = "=".repeat((4 - (b64u.length % 4)) % 4);
    const b64 = (b64u + pad).replace(/-/g, "+").replace(/_/g, "/");
    return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

function uint8ArrayToBase64url(arr: Uint8Array): string {
    return btoa(String.fromCharCode(...arr))
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");
}

async function importVapidPrivateKey(
    privateKeyB64u: string,
    publicKeyB64u: string
): Promise<CryptoKey> {
    const pubBytes = base64urlToUint8Array(publicKeyB64u);
    const x = uint8ArrayToBase64url(pubBytes.slice(1, 33));
    const y = uint8ArrayToBase64url(pubBytes.slice(33, 65));
    return crypto.subtle.importKey(
        "jwk",
        { kty: "EC", crv: "P-256", x, y, d: privateKeyB64u, key_ops: ["sign"], ext: true },
        { name: "ECDSA", namedCurve: "P-256" },
        false,
        ["sign"]
    );
}

async function createVapidJWT(audience: string, privateKey: CryptoKey, email: string): Promise<string> {
    const enc = (obj: object) =>
        uint8ArrayToBase64url(new TextEncoder().encode(JSON.stringify(obj)));
    const header = enc({ alg: "ES256", typ: "JWT" });
    const payload = enc({ aud: audience, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: email });
    const sigInput = new TextEncoder().encode(`${header}.${payload}`);
    const sigRaw = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, privateKey, sigInput);
    return `${header}.${payload}.${uint8ArrayToBase64url(new Uint8Array(sigRaw))}`;
}

interface PushSubscriptionJSON {
    endpoint: string;
    keys: { p256dh: string; auth: string };
}

async function encryptWebPushPayload(
    plaintext: Uint8Array,
    p256dhB64u: string,
    authB64u: string
): Promise<Uint8Array> {
    const receiverPubBytes = base64urlToUint8Array(p256dhB64u);
    const authSecret = base64urlToUint8Array(authB64u);

    const receiverKey = await crypto.subtle.importKey(
        "raw", receiverPubBytes, { name: "ECDH", namedCurve: "P-256" }, true, []
    );
    const senderKeyPair = await crypto.subtle.generateKey(
        { name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]
    );
    const senderPubRaw = new Uint8Array(await crypto.subtle.exportKey("raw", senderKeyPair.publicKey));
    const ecdhSecret = new Uint8Array(await crypto.subtle.deriveBits(
        { name: "ECDH", public: receiverKey }, senderKeyPair.privateKey, 256
    ));
    const salt = crypto.getRandomValues(new Uint8Array(16));

    const ikmInfoPrefix = new TextEncoder().encode("WebPush: info\x00");
    const ikmInfo = new Uint8Array(ikmInfoPrefix.length + 65 + 65);
    ikmInfo.set(ikmInfoPrefix, 0);
    ikmInfo.set(receiverPubBytes, ikmInfoPrefix.length);
    ikmInfo.set(senderPubRaw, ikmInfoPrefix.length + 65);

    const ecdhKeyMaterial = await crypto.subtle.importKey("raw", ecdhSecret, "HKDF", false, ["deriveBits"]);
    const IKM = new Uint8Array(await crypto.subtle.deriveBits(
        { name: "HKDF", hash: "SHA-256", salt: authSecret, info: ikmInfo }, ecdhKeyMaterial, 256
    ));

    const ikmKey = await crypto.subtle.importKey("raw", IKM, "HKDF", false, ["deriveBits"]);
    const CEK = new Uint8Array(await crypto.subtle.deriveBits(
        { name: "HKDF", hash: "SHA-256", salt, info: new TextEncoder().encode("Content-Encoding: aes128gcm\x00") },
        ikmKey, 128
    ));
    const nonce = new Uint8Array(await crypto.subtle.deriveBits(
        { name: "HKDF", hash: "SHA-256", salt, info: new TextEncoder().encode("Content-Encoding: nonce\x00") },
        ikmKey, 96
    ));

    const padded = new Uint8Array(plaintext.length + 1);
    padded.set(plaintext, 0);
    padded[plaintext.length] = 0x02;

    const aesKey = await crypto.subtle.importKey("raw", CEK, { name: "AES-GCM" }, false, ["encrypt"]);
    const ciphertext = new Uint8Array(
        await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce, tagLength: 128 }, aesKey, padded)
    );

    const header = new Uint8Array(16 + 4 + 1 + 65);
    const view = new DataView(header.buffer);
    header.set(salt, 0);
    view.setUint32(16, 4096, false);
    view.setUint8(20, 65);
    header.set(senderPubRaw, 21);

    const body = new Uint8Array(header.length + ciphertext.length);
    body.set(header, 0);
    body.set(ciphertext, header.length);
    return body;
}

async function sendPushNotification(
    sub: PushSubscriptionJSON,
    payload: { title: string; body: string; url?: string },
    vapidPrivateKey: CryptoKey,
    vapidPublicKeyB64u: string,
    vapidEmail: string
): Promise<void> {
    const url = new URL(sub.endpoint);
    const audience = `${url.protocol}//${url.hostname}`;
    const sub_claim = vapidEmail.startsWith("mailto:") ? vapidEmail : `mailto:${vapidEmail}`;
    const jwt = await createVapidJWT(audience, vapidPrivateKey, sub_claim);
    const plaintext = new TextEncoder().encode(JSON.stringify(payload));
    const body = await encryptWebPushPayload(plaintext, sub.keys.p256dh, sub.keys.auth);

    const resp = await fetch(sub.endpoint, {
        method: "POST",
        headers: {
            "Authorization": `vapid t=${jwt},k=${vapidPublicKeyB64u}`,
            "Content-Type": "application/octet-stream",
            "Content-Encoding": "aes128gcm",
            "TTL": "86400",
        },
        body,
    });

    console.log(`Push response: ${resp.status} (endpoint: ${url.hostname})`);
    if (!resp.ok && resp.status !== 201) {
        const errText = await resp.text().catch(() => "");
        throw new Error(`Push failed ${resp.status}: ${errText}`);
    }
}

// ─────────────────────────────────────────────
// Gmail OAuth 2.0 helpers
// ─────────────────────────────────────────────

async function getGmailAccessToken(clientId: string, clientSecret: string, refreshToken: string): Promise<string> {
    const resp = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
            grant_type: "refresh_token",
        }),
    });
    if (!resp.ok) throw new Error(`Gmail token refresh failed: ${await resp.text()}`);
    return (await resp.json()).access_token;
}

function toBase64Url(str: string): string {
    const bytes = new TextEncoder().encode(str);
    let binary = "";
    for (const b of bytes) binary += String.fromCharCode(b);
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function encodeMimeHeader(text: string): string {
    const bytes = new TextEncoder().encode(text);
    let binary = "";
    for (const b of bytes) binary += String.fromCharCode(b);
    return `=?UTF-8?B?${btoa(binary)}?=`;
}

async function sendGmailMessage(
    accessToken: string,
    fromEmail: string,
    to: string,
    cc: string[],
    subject: string,
    body: string
): Promise<void> {
    const lines = [
        `From: ${encodeMimeHeader("AlApp Érvényesség")} <${fromEmail}>`,
        `To: ${to}`,
    ];
    if (cc.length > 0) lines.push(`Cc: ${cc.join(", ")}`);
    lines.push(
        `Subject: ${encodeMimeHeader(subject)}`,
        "MIME-Version: 1.0",
        "Content-Type: text/plain; charset=UTF-8",
        "",
        body,
    );

    const resp = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ raw: toBase64Url(lines.join("\r\n")) }),
    });
    if (!resp.ok) throw new Error(`Gmail send failed ${resp.status}: ${await resp.text()}`);
}

// ─────────────────────────────────────────────
// Main handler
// ─────────────────────────────────────────────

serve(async (req) => {
    const corsHeaders = getCorsHeaders(req);
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        console.log("Starting check-expirations...");

        const supabaseUrl        = Deno.env.get("SUPABASE_URL")!;
        const serviceKey         = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const gmailUser          = Deno.env.get("SMTP_USER")!;
        const googleClientId     = Deno.env.get("GOOGLE_CLIENT_ID")!;
        const googleClientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET")!;
        const googleRefreshToken = Deno.env.get("GOOGLE_REFRESH_TOKEN")!;
        const vapidPub           = Deno.env.get("VAPID_PUBLIC_KEY")!;
        const vapidPriv          = Deno.env.get("VAPID_PRIVATE_KEY")!;
        const vapidEmail         = `mailto:${gmailUser}`;

        const supabase = createClient(supabaseUrl, serviceKey);

        // 1. Admin/manager emailek és push subscription-ok lekérése
        const { data: managers } = await supabase
            .from("user_profiles")
            .select("id, email")
            .in("role", ["admin", "manager"]);

        const managerIds    = (managers ?? []).map((m) => m.id);
        const managerEmails = [...new Set((managers ?? []).map((m) => m.email).filter(Boolean))] as string[];

        console.log(`Managers/admins: ${managerEmails.length}`);

        // 2. Lejárati időablak: 90, 30, 0–10 nap
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const maxDate = new Date(today);
        maxDate.setDate(today.getDate() + 92);

        const todayStr   = today.toISOString().split("T")[0];
        const maxDateStr = maxDate.toISOString().split("T")[0];
        console.log(`Checking expirations ${todayStr} → ${maxDateStr}`);

        const { data: fieldValues, error: fvError } = await supabase
            .from("field_values")
            .select(`
                id,
                value_date,
                entity:entities (
                    id,
                    display_name,
                    module,
                    responsible_user_id,
                    responsible_profile:user_profiles!responsible_user_id(id, email, full_name),
                    field_values (
                        value_text,
                        field_schemas (field_name)
                    )
                ),
                schema:field_schemas (field_name)
            `)
            .gte("value_date", todayStr)
            .lte("value_date", maxDateStr);

        if (fvError) throw fvError;

        if (!fieldValues || fieldValues.length === 0) {
            console.log("No items in range.");
            return new Response(
                JSON.stringify({ message: "No items found", start: todayStr, end: maxDateStr }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        console.log(`${fieldValues.length} items found. Filtering by threshold...`);

        // 3. Csak a threshold napokhoz tartozó tételek
        type EntityType = {
            id: string;
            display_name: string;
            module: string;
            responsible_user_id: string | null;
            responsible_profile: { id: string; email: string; full_name: string } | null;
            field_values: { value_text: string; field_schemas: { field_name: string } | null }[];
        };

        const toAlert: { entity: EntityType; fieldName: string; diffDays: number; urgency: string }[] = [];

        for (const item of fieldValues) {
            const entity = item.entity as EntityType | null;
            if (!entity) continue;

            const expiryDate = new Date(item.value_date);
            expiryDate.setHours(0, 0, 0, 0);
            const diffDays = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            const is90      = diffDays === 90;
            const is30      = diffDays === 30;
            const isCritical = diffDays <= 10 && diffDays >= 0;
            if (!is90 && !is30 && !isCritical) continue;

            const fieldName = item.schema?.field_name || "Ismeretlen mező";
            const urgency   = is90 ? "(Előzetes)" : is30 ? "(Figyelmeztetés)" : "❗ KRITIKUS";

            toAlert.push({ entity, fieldName, diffDays, urgency });
        }

        console.log(`${toAlert.length} items to alert.`);
        if (toAlert.length === 0) {
            return new Response(
                JSON.stringify({ message: "No alerts today" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 4. Push subscription-ok lekérése (felelősök + adminok)
        const responsibleIds = [...new Set(
            toAlert.map((a) => a.entity.responsible_user_id).filter(Boolean) as string[]
        )];
        const allUserIds = [...new Set([...responsibleIds, ...managerIds])];

        const { data: pushSubRows } = await supabase
            .from("push_subscriptions")
            .select("user_id, subscription")
            .in("user_id", allUserIds);

        const pushSubsMap = new Map<string, PushSubscriptionJSON[]>();
        for (const ps of pushSubRows ?? []) {
            const list = pushSubsMap.get(ps.user_id) ?? [];
            list.push(ps.subscription as PushSubscriptionJSON);
            pushSubsMap.set(ps.user_id, list);
        }

        // 5. VAPID private key betöltése
        const vapidPrivateKey = await importVapidPrivateKey(vapidPriv, vapidPub).catch((e) => {
            console.error("VAPID key import error:", e);
            return null;
        });

        // 6. Gmail access token
        const gmailAccessToken = await getGmailAccessToken(googleClientId, googleClientSecret, googleRefreshToken);

        const results: { entity: string; field: string; days: number; email: boolean; push: boolean }[] = [];

        for (const { entity, fieldName, diffDays, urgency } of toAlert) {
            const moduleLabel =
                entity.module === "personnel" ? "Személyzet" :
                entity.module === "vehicles"  ? "Járművek"   :
                entity.module === "equipment" ? "Eszközök"   : entity.module;

            // Felelős email: responsible_profile vagy személyzeti email mező
            let recipientEmail = entity.responsible_profile?.email ?? null;
            let recipientName  = entity.responsible_profile?.full_name ?? null;
            const responsibleId = entity.responsible_user_id;

            if (!recipientEmail && Array.isArray(entity.field_values)) {
                const emailField = entity.field_values.find(
                    (fv) => fv.field_schemas?.field_name?.toLowerCase().includes("email") && fv.value_text
                );
                if (emailField) {
                    recipientEmail = emailField.value_text;
                    recipientName  = entity.display_name;
                }
            }

            const subject = `[LEJÁRAT] ${diffDays} nap: ${entity.display_name} – ${fieldName} ${urgency}`;
            const emailBody = `Kedves ${recipientName || "Felhasználó"}!

Ez egy automatikus értesítés. Az alábbi tétel dokumentuma hamarosan lejár:

Modul: ${moduleLabel}
Név / Azonosító: ${entity.display_name}
Lejáró dokumentum: ${fieldName}
Hátralévő napok: ${diffDays} nap
Urgencia: ${urgency}

Kérjük, gondoskodjon a megújításról!

Üdvözlettel,
AlApp Rendszer`.trim();

            let emailSent = false;
            let pushSent  = false;

            // ── Email ─────────────────────────────────
            if (recipientEmail) {
                const cc = managerEmails.filter((e) => e !== recipientEmail);
                try {
                    await sendGmailMessage(gmailAccessToken, gmailUser, recipientEmail, cc, subject, emailBody);
                    emailSent = true;
                    console.log(`Email sent: ${entity.display_name} (${diffDays}d)`);
                } catch (e) {
                    console.error(`Email hiba (${entity.display_name}):`, e);
                }
            } else {
                console.log(`No email for ${entity.display_name}, skipping email.`);
            }

            // ── Push ─────────────────────────────────
            // Küldés: felelős + adminok (akiknek van subscription)
            const pushUserIds = [
                ...(responsibleId ? [responsibleId] : []),
                ...managerIds,
            ].filter((id, idx, arr) => arr.indexOf(id) === idx); // deduplicate

            const pushPayload = {
                title: `Lejárat: ${entity.display_name}`,
                body: `${fieldName} – ${diffDays} nap ${urgency}`,
                url: `/${entity.module}`,
            };

            const pushPromises: Promise<void>[] = [];
            for (const uid of pushUserIds) {
                const subs = pushSubsMap.get(uid) ?? [];
                for (const sub of subs) {
                    if (vapidPrivateKey) {
                        pushPromises.push(
                            sendPushNotification(sub, pushPayload, vapidPrivateKey, vapidPub, vapidEmail)
                        );
                    }
                }
            }

            if (pushPromises.length > 0) {
                const pushResults = await Promise.allSettled(pushPromises);
                pushSent = pushResults.some((r) => r.status === "fulfilled");
                pushResults.forEach((r, i) => {
                    if (r.status === "rejected") console.error(`Push hiba (${entity.display_name}, sub ${i}):`, r.reason);
                });
            }

            results.push({ entity: entity.display_name, field: fieldName, days: diffDays, email: emailSent, push: pushSent });
        }

        console.log(`Done. ${results.filter((r) => r.email).length} email, ${results.filter((r) => r.push).length} push sent.`);

        return new Response(
            JSON.stringify({ message: "Check complete", processed: results.length, details: results }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error("check-expirations error:", msg);
        return new Response(
            JSON.stringify({ error: msg }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
