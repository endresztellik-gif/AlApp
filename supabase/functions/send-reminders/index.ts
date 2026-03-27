import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getCorsHeaders } from "../_shared/cors.ts";

// ─────────────────────────────────────────────
// VAPID helpers (Deno Web Crypto, nincs npm lib)
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

    const jwk = {
        kty: "EC",
        crv: "P-256",
        x,
        y,
        d: privateKeyB64u,
        key_ops: ["sign"],
        ext: true,
    };

    return crypto.subtle.importKey(
        "jwk",
        jwk,
        { name: "ECDSA", namedCurve: "P-256" },
        false,
        ["sign"]
    );
}

async function createVapidJWT(
    audience: string,
    privateKey: CryptoKey,
    email: string
): Promise<string> {
    const enc = (obj: object) =>
        uint8ArrayToBase64url(new TextEncoder().encode(JSON.stringify(obj)));

    const header = enc({ alg: "ES256", typ: "JWT" });
    const payload = enc({
        aud: audience,
        exp: Math.floor(Date.now() / 1000) + 12 * 3600,
        sub: email,
    });

    const sigInput = new TextEncoder().encode(`${header}.${payload}`);
    const sigRaw = await crypto.subtle.sign(
        { name: "ECDSA", hash: "SHA-256" },
        privateKey,
        sigInput
    );

    return `${header}.${payload}.${uint8ArrayToBase64url(new Uint8Array(sigRaw))}`;
}

interface PushSubscriptionJSON {
    endpoint: string;
    keys: { p256dh: string; auth: string };
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

    const jwt = await createVapidJWT(audience, vapidPrivateKey, vapidEmail);
    const payloadBytes = new TextEncoder().encode(JSON.stringify(payload));

    const resp = await fetch(sub.endpoint, {
        method: "POST",
        headers: {
            "Authorization": `vapid t=${jwt},k=${vapidPublicKeyB64u}`,
            "Content-Type": "application/octet-stream",
            "TTL": "86400",
            "Content-Encoding": "aesgcm",
        },
        body: payloadBytes,
    });

    if (!resp.ok && resp.status !== 201) {
        const body = await resp.text().catch(() => "");
        throw new Error(`Push failed ${resp.status}: ${body}`);
    }
}

// ─────────────────────────────────────────────
// Gmail OAuth 2.0 helpers
// ─────────────────────────────────────────────

async function getGmailAccessToken(
    clientId: string,
    clientSecret: string,
    refreshToken: string
): Promise<string> {
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
    if (!resp.ok) {
        const err = await resp.text();
        throw new Error(`Gmail token refresh failed: ${err}`);
    }
    const json = await resp.json();
    return json.access_token;
}

function toBase64Url(str: string): string {
    const bytes = new TextEncoder().encode(str);
    let binary = "";
    for (const b of bytes) binary += String.fromCharCode(b);
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function encodeMimeSubject(subject: string): string {
    const bytes = new TextEncoder().encode(subject);
    let binary = "";
    for (const b of bytes) binary += String.fromCharCode(b);
    return `=?UTF-8?B?${btoa(binary)}?=`;
}

async function sendGmailMessage(
    accessToken: string,
    fromEmail: string,
    to: string,
    subject: string,
    body: string
): Promise<void> {
    const message = [
        `From: ${encodeMimeSubject("AlApp Emlékeztető")} <${fromEmail}>`,
        `To: ${to}`,
        `Subject: ${encodeMimeSubject(subject)}`,
        "MIME-Version: 1.0",
        "Content-Type: text/plain; charset=UTF-8",
        "",
        body,
    ].join("\r\n");

    const resp = await fetch(
        "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ raw: toBase64Url(message) }),
        }
    );

    if (!resp.ok) {
        const err = await resp.text();
        throw new Error(`Gmail send failed ${resp.status}: ${err}`);
    }
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
        const supabaseUrl        = Deno.env.get("SUPABASE_URL")!;
        const serviceKey         = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const gmailUser          = Deno.env.get("SMTP_USER")!;
        const googleClientId     = Deno.env.get("GOOGLE_CLIENT_ID")!;
        const googleClientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET")!;
        const googleRefreshToken = Deno.env.get("GOOGLE_REFRESH_TOKEN")!;
        const vapidPub           = Deno.env.get("VAPID_PUBLIC_KEY")!;
        const vapidPriv          = Deno.env.get("VAPID_PRIVATE_KEY")!;
        const vapidEmail         = Deno.env.get("VAPID_EMAIL") ?? `mailto:${gmailUser}`;

        const supabase = createClient(supabaseUrl, serviceKey);

        // 1. Esedékes, még nem kiküldött értesítések
        const now = new Date().toISOString();

        const { data: duePending, error: queryErr } = await supabase
            .from("personal_reminder_notifications")
            .select(`
                id,
                notify_before_minutes,
                user_id,
                reminder:personal_reminders!inner(
                    id, title, description, due_at, is_done
                )
            `)
            .is("sent_at", null)
            .eq("reminder.is_done", false);

        if (queryErr) throw queryErr;
        if (!duePending || duePending.length === 0) {
            return new Response(
                JSON.stringify({ message: "No pending reminders", checked_at: now }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        interface ReminderJoin {
            id: string;
            title: string;
            description: string | null;
            due_at: string;
            is_done: boolean;
        }
        interface PendingRow {
            id: string;
            notify_before_minutes: number;
            user_id: string;
            reminder: ReminderJoin;
        }

        const triggered = (duePending as PendingRow[]).filter((row) => {
            const dueMs     = new Date(row.reminder.due_at).getTime();
            const triggerMs = dueMs - row.notify_before_minutes * 60 * 1000;
            return triggerMs <= Date.now();
        });

        if (triggered.length === 0) {
            return new Response(
                JSON.stringify({ message: "No triggered reminders yet", pending: duePending.length }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 2. User emailek és push subscription-ok lekérése
        const userIds = [...new Set(triggered.map((r) => r.user_id))];

        const [{ data: profiles }, { data: pushSubs }] = await Promise.all([
            supabase
                .from("user_profiles")
                .select("id, email, full_name")
                .in("id", userIds),
            supabase
                .from("push_subscriptions")
                .select("user_id, subscription")
                .in("user_id", userIds),
        ]);

        const profileMap  = new Map(profiles?.map((p)  => [p.id,  p]));
        const pushSubsMap = new Map(pushSubs?.map((ps) => [ps.user_id, ps.subscription as PushSubscriptionJSON]));

        // 3. VAPID private key betöltése
        const vapidPrivateKey = await importVapidPrivateKey(vapidPriv, vapidPub).catch((e) => {
            console.error("VAPID key import error:", e);
            return null;
        });

        // 4. Gmail access token (egyszer az összes emailhez)
        const gmailAccessToken = await getGmailAccessToken(
            googleClientId,
            googleClientSecret,
            googleRefreshToken
        );

        const results: { id: string; email: boolean; push: boolean }[] = [];

        for (const row of triggered) {
            const profile  = profileMap.get(row.user_id);
            const pushSub  = pushSubsMap.get(row.user_id);
            const reminder = row.reminder;
            const dueDate  = new Date(reminder.due_at);

            const dueDateStr = dueDate.toLocaleDateString("hu-HU", {
                year: "numeric", month: "long", day: "numeric",
                hour: "2-digit", minute: "2-digit",
            });

            const minutesBefore = row.notify_before_minutes;
            let when = "Pontosan az időpontban";
            if      (minutesBefore >= 10080) when = `${Math.round(minutesBefore / 10080)} héttel előtte`;
            else if (minutesBefore >= 1440)  when = `${Math.round(minutesBefore / 1440)} nappal előtte`;
            else if (minutesBefore >= 60)    when = `${Math.round(minutesBefore / 60)} órával előtte`;
            else if (minutesBefore > 0)      when = `${minutesBefore} perccel előtte`;

            const notifTitle = `Emlékeztető: ${reminder.title}`;
            const notifBody  = `Határidő: ${dueDateStr}${reminder.description ? `\n${reminder.description}` : ""}`;

            let emailSent = false;
            let pushSent  = false;

            // ── Email ─────────────────────────────────
            if (profile?.email) {
                try {
                    await sendGmailMessage(
                        gmailAccessToken,
                        gmailUser,
                        profile.email,
                        notifTitle,
                        `Szia!

Ez egy automatikus emlékeztető, amit "${reminder.title}" tárgyban állítottál be ${dueDateStr}-ra.${reminder.description ? `\n\nMegjegyzés: ${reminder.description}` : ""}

Értesítési beállítás: ${when}

A személyes emlékeztetőidet az AlApp /reminders oldalán kezelheted.

Üdvözlettel,
AlApp Rendszer`
                    );
                    emailSent = true;
                } catch (e) {
                    console.error(`Email hiba (user ${row.user_id}):`, e);
                }
            }

            // ── Push ──────────────────────────────────
            if (pushSub && vapidPrivateKey) {
                try {
                    await sendPushNotification(
                        pushSub,
                        { title: notifTitle, body: notifBody, url: "/reminders" },
                        vapidPrivateKey,
                        vapidPub,
                        vapidEmail
                    );
                    pushSent = true;
                } catch (e) {
                    console.error(`Push hiba (user ${row.user_id}):`, e);
                }
            }

            // ── sent_at beállítása ────────────────────
            await supabase
                .from("personal_reminder_notifications")
                .update({ sent_at: new Date().toISOString() })
                .eq("id", row.id);

            results.push({ id: row.id, email: emailSent, push: pushSent });
        }

        return new Response(
            JSON.stringify({
                message: "Reminders processed",
                processed: results.length,
                details: results,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("send-reminders error:", msg);
        return new Response(
            JSON.stringify({ error: msg }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
