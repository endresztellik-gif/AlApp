import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getCorsHeaders } from "../_shared/cors.ts";

// ─── VAPID helpers (copy from send-reminders) ───

function base64urlToUint8Array(b64u: string): Uint8Array {
    const pad = "=".repeat((4 - (b64u.length % 4)) % 4);
    const b64 = (b64u + pad).replace(/-/g, "+").replace(/_/g, "/");
    return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

function uint8ArrayToBase64url(arr: Uint8Array): string {
    return btoa(String.fromCharCode(...arr))
        .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

async function importVapidPrivateKey(privateKeyB64u: string, publicKeyB64u: string): Promise<CryptoKey> {
    const pubBytes = base64urlToUint8Array(publicKeyB64u);
    const x = uint8ArrayToBase64url(pubBytes.slice(1, 33));
    const y = uint8ArrayToBase64url(pubBytes.slice(33, 65));
    return crypto.subtle.importKey(
        "jwk",
        { kty: "EC", crv: "P-256", x, y, d: privateKeyB64u, key_ops: ["sign"], ext: true },
        { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]
    );
}

async function createVapidJWT(audience: string, privateKey: CryptoKey, email: string): Promise<string> {
    const enc = (obj: object) => uint8ArrayToBase64url(new TextEncoder().encode(JSON.stringify(obj)));
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

async function encryptWebPushPayload(plaintext: Uint8Array, p256dhB64u: string, authB64u: string): Promise<Uint8Array> {
    const receiverPubBytes = base64urlToUint8Array(p256dhB64u);
    const authSecret = base64urlToUint8Array(authB64u);
    const receiverKey = await crypto.subtle.importKey("raw", receiverPubBytes, { name: "ECDH", namedCurve: "P-256" }, true, []);
    const senderKeyPair = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
    const senderPubRaw = new Uint8Array(await crypto.subtle.exportKey("raw", senderKeyPair.publicKey));
    const ecdhSecret = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: receiverKey }, senderKeyPair.privateKey, 256));
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const ikmInfoPrefix = new TextEncoder().encode("WebPush: info\x00");
    const ikmInfo = new Uint8Array(ikmInfoPrefix.length + 65 + 65);
    ikmInfo.set(ikmInfoPrefix, 0); ikmInfo.set(receiverPubBytes, ikmInfoPrefix.length); ikmInfo.set(senderPubRaw, ikmInfoPrefix.length + 65);
    const ecdhKeyMaterial = await crypto.subtle.importKey("raw", ecdhSecret, "HKDF", false, ["deriveBits"]);
    const IKM = new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt: authSecret, info: ikmInfo }, ecdhKeyMaterial, 256));
    const ikmKey = await crypto.subtle.importKey("raw", IKM, "HKDF", false, ["deriveBits"]);
    const CEK = new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info: new TextEncoder().encode("Content-Encoding: aes128gcm\x00") }, ikmKey, 128));
    const nonce = new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info: new TextEncoder().encode("Content-Encoding: nonce\x00") }, ikmKey, 96));
    const padded = new Uint8Array(plaintext.length + 1);
    padded.set(plaintext, 0); padded[plaintext.length] = 0x02;
    const aesKey = await crypto.subtle.importKey("raw", CEK, { name: "AES-GCM" }, false, ["encrypt"]);
    const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce, tagLength: 128 }, aesKey, padded));
    const header = new Uint8Array(16 + 4 + 1 + 65);
    const view = new DataView(header.buffer);
    header.set(salt, 0); view.setUint32(16, 4096, false); view.setUint8(20, 65); header.set(senderPubRaw, 21);
    const body = new Uint8Array(header.length + ciphertext.length);
    body.set(header, 0); body.set(ciphertext, header.length);
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
    const body = await encryptWebPushPayload(new TextEncoder().encode(JSON.stringify(payload)), sub.keys.p256dh, sub.keys.auth);
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
    console.log(`Push response: ${resp.status} (${url.hostname})`);
    if (!resp.ok && resp.status !== 201) {
        throw new Error(`Push failed ${resp.status}: ${await resp.text().catch(() => "")}`);
    }
}

// ─── Gmail OAuth helpers ───

async function getGmailAccessToken(clientId: string, clientSecret: string, refreshToken: string): Promise<string> {
    const resp = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: "refresh_token" }),
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
    subject: string,
    htmlBody: string
): Promise<void> {
    const lines = [
        `From: ${encodeMimeHeader("AlApp Eszközkezelés")} <${fromEmail}>`,
        `To: ${to}`,
        `Subject: ${encodeMimeHeader(subject)}`,
        "MIME-Version: 1.0",
        "Content-Type: text/html; charset=UTF-8",
        "",
        htmlBody,
    ];
    const resp = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ raw: toBase64Url(lines.join("\r\n")) }),
    });
    if (!resp.ok) throw new Error(`Gmail send failed ${resp.status}: ${await resp.text()}`);
}

// ─── Main handler ───

serve(async (req) => {
    const corsHeaders = getCorsHeaders(req);
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

    try {
        console.log("Starting equipment-checkout-reminder...");

        const supabaseUrl        = Deno.env.get("SUPABASE_URL")!;
        const serviceKey         = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const gmailUser          = Deno.env.get("SMTP_USER")!;
        const googleClientId     = Deno.env.get("GOOGLE_CLIENT_ID")!;
        const googleClientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET")!;
        const googleRefreshToken = Deno.env.get("GOOGLE_REFRESH_TOKEN")!;
        const vapidPub           = Deno.env.get("VAPID_PUBLIC_KEY")!;
        const vapidPriv          = Deno.env.get("VAPID_PRIVATE_KEY")!;
        const siteUrl            = Deno.env.get("SITE_URL") ?? "https://dunaialapp.netlify.app";
        const vapidEmail         = `mailto:${gmailUser}`;

        const supabase = createClient(supabaseUrl, serviceKey);

        // Aktív kölcsönzések ahol ma kell emlékeztetni
        // Feltétel: returned_at IS NULL && last_reminder_sent_at::date < today (vagy null)
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const { data: checkouts, error } = await supabase
            .from("equipment_checkouts")
            .select(`
                id,
                equipment_id,
                user_id,
                checked_out_at,
                last_reminder_sent_at,
                equipment(id, display_name),
                user:user_profiles(id, full_name, email)
            `)
            .is("returned_at", null)
            .or(`last_reminder_sent_at.is.null,last_reminder_sent_at.lt.${todayStart.toISOString()}`);

        if (error) throw error;

        if (!checkouts || checkouts.length === 0) {
            console.log("No checkouts to remind.");
            return new Response(
                JSON.stringify({ message: "No active checkouts to remind" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        console.log(`${checkouts.length} checkouts to remind.`);

        // Push subscriptions lekérése
        const userIds = [...new Set(checkouts.map((c) => c.user_id))];
        const { data: pushSubRows } = await supabase
            .from("push_subscriptions")
            .select("user_id, subscription")
            .in("user_id", userIds);

        const pushSubsMap = new Map<string, PushSubscriptionJSON[]>();
        for (const ps of pushSubRows ?? []) {
            const list = pushSubsMap.get(ps.user_id) ?? [];
            list.push(ps.subscription as PushSubscriptionJSON);
            pushSubsMap.set(ps.user_id, list);
        }

        // VAPID + Gmail token
        const vapidPrivateKey = await importVapidPrivateKey(vapidPriv, vapidPub).catch((e) => {
            console.error("VAPID key import error:", e);
            return null;
        });

        const gmailAccessToken = await getGmailAccessToken(googleClientId, googleClientSecret, googleRefreshToken);

        const results: { id: string; name: string; email: boolean; push: boolean }[] = [];

        for (const checkout of checkouts) {
            const equip = checkout.equipment as unknown as { id: string; display_name: string } | null;
            const userRow = checkout.user as unknown as { id: string; full_name: string; email: string } | null;

            if (!equip || !userRow) continue;

            const checkoutUrl = `${siteUrl}/equipment/checkout/${equip.id}`;
            const yesUrl = `${checkoutUrl}/ack?r=yes`;
            const noUrl  = `${checkoutUrl}/ack?r=no`;

            const checkedOutDate = new Date(checkout.checked_out_at).toLocaleDateString("hu-HU", {
                month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
            });

            let emailSent = false;
            let pushSent  = false;

            // ── Email (HTML, magic linkekkel) ──
            if (userRow.email) {
                const htmlBody = `
<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
  <h2 style="color: #235634;">🔧 Lezáratlan eszköz emlékeztető</h2>
  <p>Szia <strong>${userRow.full_name}</strong>!</p>
  <p>Az alábbi eszköz még nálad van:</p>
  <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; margin: 16px 0;">
    <strong style="font-size: 16px;">${equip.display_name}</strong><br>
    <span style="color: #6b7280;">Felvéve: ${checkedOutDate}</span>
  </div>
  <p>Visszavitted már az eszközt?</p>
  <table cellpadding="0" cellspacing="0" style="margin: 20px 0;">
    <tr>
      <td style="padding-right: 12px;">
        <a href="${yesUrl}" style="display:inline-block; background: #3D9E52; color: white; font-weight: bold; padding: 12px 24px; border-radius: 10px; text-decoration: none;">
          ✅ Igen, visszavittem
        </a>
      </td>
      <td>
        <a href="${noUrl}" style="display:inline-block; background: #f3f4f6; color: #374151; font-weight: bold; padding: 12px 24px; border-radius: 10px; text-decoration: none; border: 1px solid #d1d5db;">
          ❌ Nem, még nálam van
        </a>
      </td>
    </tr>
  </table>
  <p style="color: #9ca3af; font-size: 12px;">
    Ha visszavitted, a rendszer automatikusan frissíti az állapotot.<br>
    Az eszközt a programban is lezárhatod: <a href="${checkoutUrl}">${checkoutUrl}</a>
  </p>
</div>`.trim();

                try {
                    await sendGmailMessage(
                        gmailAccessToken,
                        gmailUser,
                        userRow.email,
                        `Lezáratlan eszköz: ${equip.display_name}`,
                        htmlBody
                    );
                    emailSent = true;
                    console.log(`Email sent to ${userRow.email} for ${equip.display_name}`);
                } catch (e) {
                    console.error(`Email error (${userRow.email}):`, e);
                }
            }

            // ── Push (figyelmeztetés, app linkkel) ──
            const subs = pushSubsMap.get(checkout.user_id) ?? [];
            if (subs.length > 0 && vapidPrivateKey) {
                const pushResults = await Promise.allSettled(
                    subs.map((sub) =>
                        sendPushNotification(
                            sub,
                            {
                                title: `🔧 Lezáratlan eszköz`,
                                body: `${equip.display_name} még nálad van. Zárd le a programban.`,
                                url: checkoutUrl,
                            },
                            vapidPrivateKey,
                            vapidPub,
                            vapidEmail
                        )
                    )
                );
                pushSent = pushResults.some((r) => r.status === "fulfilled");
                pushResults.forEach((r, i) => {
                    if (r.status === "rejected") console.error(`Push error (sub ${i}):`, r.reason);
                });
            }

            // last_reminder_sent_at frissítése
            await supabase
                .from("equipment_checkouts")
                .update({ last_reminder_sent_at: new Date().toISOString() })
                .eq("id", checkout.id);

            results.push({ id: checkout.id, name: equip.display_name, email: emailSent, push: pushSent });
        }

        console.log(`Done. ${results.filter(r => r.email).length} email, ${results.filter(r => r.push).length} push sent.`);

        return new Response(
            JSON.stringify({ message: "Reminders sent", processed: results.length, details: results }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("equipment-checkout-reminder error:", msg);
        return new Response(
            JSON.stringify({ error: msg }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
