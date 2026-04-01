// export-audit-logs – Havi audit napló export emailben
// Futtatás: havonta 1-jén 06:00 UTC (cron ütemező) vagy manuálisan POST kéréssel

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

// ── Gmail segédfüggvények (azonos minta mint check-expirations-ban) ──────────

async function getGmailAccessToken(
    clientId: string,
    clientSecret: string,
    refreshToken: string,
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

// CSV melléklettel rendelkező email küldése
async function sendGmailWithAttachment(
    accessToken: string,
    fromEmail: string,
    to: string[],
    subject: string,
    body: string,
    csvContent: string,
    csvFilename: string,
): Promise<void> {
    const boundary = "AlApp_audit_boundary_" + Date.now();

    const csvBase64 = btoa(unescape(encodeURIComponent(csvContent)));

    const lines = [
        `From: ${encodeMimeHeader("AlApp Audit")} <${fromEmail}>`,
        `To: ${to.join(", ")}`,
        `Subject: ${encodeMimeHeader(subject)}`,
        "MIME-Version: 1.0",
        `Content-Type: multipart/mixed; boundary="${boundary}"`,
        "",
        `--${boundary}`,
        "Content-Type: text/plain; charset=UTF-8",
        "Content-Transfer-Encoding: base64",
        "",
        btoa(unescape(encodeURIComponent(body))),
        "",
        `--${boundary}`,
        `Content-Type: text/csv; charset=UTF-8; name="${csvFilename}"`,
        "Content-Transfer-Encoding: base64",
        `Content-Disposition: attachment; filename="${csvFilename}"`,
        "",
        csvBase64,
        "",
        `--${boundary}--`,
    ];

    const raw = toBase64Url(lines.join("\r\n"));

    const resp = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ raw }),
    });
    if (!resp.ok) throw new Error(`Gmail send failed ${resp.status}: ${await resp.text()}`);
}

// ── CSV generálás ────────────────────────────────────────────────────────────

function generateCsv(rows: Record<string, unknown>[]): string {
    const header = ["Időpont", "Felhasználó", "Email", "Művelet", "Tábla", "Record ID", "Régi érték", "Új érték"];
    const escape = (v: unknown) => {
        const s = v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
        return `"${s.replace(/"/g, '""')}"`;
    };
    const dataRows = rows.map((r) => {
        const user = r.user as { full_name?: string; email?: string } | undefined;
        return [
            escape(new Date(r.created_at as string).toLocaleString("hu-HU")),
            escape(user?.full_name ?? ""),
            escape(user?.email ?? ""),
            escape(r.action),
            escape(r.table_name),
            escape(r.record_id),
            escape(r.old_values),
            escape(r.new_values),
        ].join(",");
    });
    return "\uFEFF" + [header.join(","), ...dataRows].join("\n");
}

// ── Főkezelő ─────────────────────────────────────────────────────────────────

serve(async (req) => {
    const corsHeaders = getCorsHeaders(req);
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        console.log("Starting export-audit-logs...");

        const supabaseUrl    = Deno.env.get("SUPABASE_URL")!;
        const serviceKey     = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const gmailUser      = Deno.env.get("SMTP_USER")!;
        const googleClientId = Deno.env.get("GOOGLE_CLIENT_ID")!;
        const googleClientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET")!;
        const googleRefreshToken = Deno.env.get("GOOGLE_REFRESH_TOKEN")!;

        const supabaseAdmin = createClient(supabaseUrl, serviceKey);

        // Előző hónap tartományának meghatározása
        const now = new Date();
        const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const monthLabel = firstOfLastMonth.toLocaleDateString("hu-HU", { year: "numeric", month: "long" });

        // Audit logok lekérése az előző hónapból
        const { data: logs, error: logsError } = await supabaseAdmin
            .from("audit_log")
            .select("*, user:user_profiles(full_name, email)")
            .gte("created_at", firstOfLastMonth.toISOString())
            .lt("created_at", firstOfThisMonth.toISOString())
            .order("created_at", { ascending: false });

        if (logsError) throw logsError;

        console.log(`Found ${logs?.length ?? 0} audit log entries for ${monthLabel}`);

        // Admin emailek lekérése
        const { data: admins } = await supabaseAdmin
            .from("user_profiles")
            .select("email")
            .in("role", ["admin", "manager"])
            .eq("is_active", true);

        const adminEmails = [...new Set((admins ?? []).map((a) => a.email).filter(Boolean))] as string[];

        if (adminEmails.length === 0) {
            console.warn("No admin emails found, skipping export email.");
            return new Response(JSON.stringify({ ok: true, sent: false, reason: "no_admins" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        if ((logs?.length ?? 0) === 0) {
            console.log("No audit log entries for the previous month, skipping email.");
            return new Response(JSON.stringify({ ok: true, sent: false, reason: "no_logs" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // CSV generálás
        const csv = generateCsv(logs as Record<string, unknown>[]);
        const year = firstOfLastMonth.getFullYear();
        const month = String(firstOfLastMonth.getMonth() + 1).padStart(2, "0");
        const csvFilename = `audit_naplo_${year}_${month}.csv`;

        // Email küldése
        const accessToken = await getGmailAccessToken(googleClientId, googleClientSecret, googleRefreshToken);
        const subject = `AlApp – Havi audit napló: ${monthLabel}`;
        const body = `Tisztelt Adminisztrátor!\n\nMellékeltük az AlApp ${monthLabel} havi audit naplóját.\n\nBejegyzések száma: ${logs?.length ?? 0}\nIdőszak: ${firstOfLastMonth.toLocaleDateString("hu-HU")} – ${new Date(firstOfThisMonth.getTime() - 1).toLocaleDateString("hu-HU")}\n\nAlApp rendszer`;

        await sendGmailWithAttachment(
            accessToken,
            gmailUser,
            adminEmails,
            subject,
            body,
            csv,
            csvFilename,
        );

        console.log(`Audit export email sent to: ${adminEmails.join(", ")}`);

        return new Response(
            JSON.stringify({ ok: true, sent: true, recipients: adminEmails, entries: logs?.length }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
    } catch (err) {
        console.error("export-audit-logs error:", err);
        return new Response(
            JSON.stringify({ ok: false, error: String(err) }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
    }
});
