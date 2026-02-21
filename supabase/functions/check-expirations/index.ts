import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
    const corsHeaders = getCorsHeaders(req);
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        console.log("Starting check-expirations function...");

        // 1. Init Supabase
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // 2. Init SMTP Client (Gmail)
        const smtpUser = Deno.env.get('SMTP_USER');
        const smtpPass = Deno.env.get('SMTP_PASS');
        const smtpHost = 'smtp.gmail.com';

        if (!smtpUser || !smtpPass) {
            throw new Error('Missing SMTP_USER or SMTP_PASS environment variables.');
        }

        const client = new SmtpClient();

        // 3. Fetch Admin and Manager Emails for CC
        const { data: managers, error: managerError } = await supabase
            .from('user_profiles')
            .select('email')
            .in('role', ['admin', 'manager']);

        if (managerError) {
            console.error('Error fetching managers:', managerError);
        }

        // Filter out empty emails and duplicates
        const ccList = [...new Set(managers?.map(u => u.email).filter(e => e))] as string[];

        // Ensure the sender (smtpUser/Admin) is also included if not already
        if (!ccList.includes(smtpUser)) {
            // ccList.push(smtpUser); // Optional: if we want to CC the central sender too
        }

        console.log(`CC Recipients: ${ccList.length} admin(s)/manager(s)`);

        // 4. Define expiration window (0 to 90 days)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const maxDate = new Date(today);
        maxDate.setDate(today.getDate() + 92); // Fetch slightly more to be safe

        const todayStr = today.toISOString().split('T')[0];
        const maxDateStr = maxDate.toISOString().split('T')[0];

        console.log(`Checking expirations between ${todayStr} and ${maxDateStr}`);

        // 5. Query expiring field values
        const { data: fieldValues, error: fvError } = await supabase
            .from('field_values')
            .select(`
                id,
                value_date,
                entity:entities (
                    id, 
                    display_name, 
                    module, 
                    responsible_user_id,
                    responsible_profile:user_profiles!responsible_user_id(email, full_name),
                    field_values (
                        value_text,
                        field_schemas (field_name)
                    )
                ),
                schema:field_schemas (field_name)
            `)
            .gte('value_date', todayStr)
            .lte('value_date', maxDateStr);

        if (fvError) throw fvError;

        if (!fieldValues || fieldValues.length === 0) {
            console.log('No items found in date range.');
            return new Response(JSON.stringify({ message: "No items found in range", start: todayStr, end: maxDateStr }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        console.log(`Found ${fieldValues.length} items in query range. Filtering...`);

        const emailsToSend: { to: string; subject: string; body: string }[] = [];

        for (const item of fieldValues) {
            const entity = item.entity as {
                id: string;
                display_name: string;
                module: string;
                responsible_user_id: string | null;
                responsible_profile: { email: string; full_name: string } | null;
                field_values: { value_text: string; field_schemas: { field_name: string } | null }[];
            } | null;
            if (!entity) continue;

            const expiryDate = new Date(item.value_date);
            expiryDate.setHours(0, 0, 0, 0);

            // Calculate diffDays
            const diffTime = expiryDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            // Logic: 90 days, 30 days, or 0-10 days
            // Note: We use '===' for strict check, assuming execution is daily.
            const is90 = diffDays === 90;
            const is30 = diffDays === 30;
            const isCritical = diffDays <= 10 && diffDays >= 0;

            if (!is90 && !is30 && !isCritical) continue;

            const fieldName = item.schema?.field_name || 'Ismeretlen mező';

            // Resolve To Recipient
            let recipientEmail = entity.responsible_profile?.email;
            let recipientName = entity.responsible_profile?.full_name;

            // Fallback for Personnel module email field
            if (!recipientEmail && entity.field_values && Array.isArray(entity.field_values)) {
                const emailField = entity.field_values.find((fv) =>
                    fv.field_schemas?.field_name?.toLowerCase().includes('email') && fv.value_text
                );
                if (emailField) {
                    recipientEmail = emailField.value_text;
                    recipientName = entity.display_name;
                }
            }

            if (!recipientEmail) {
                console.log(`No recipient for ${entity.display_name}. Skipping.`);
                continue;
            }

            let urgency = "";
            if (is90) urgency = "(Előzetes)";
            if (is30) urgency = "(Figyelmeztetés)";
            if (isCritical) urgency = "!!! KRITIKUS !!!";

            const subject = `[LEJÁRAT] ${diffDays} nap: ${entity.display_name} - ${fieldName} ${urgency}`;
            const body = `
Kedves ${recipientName || 'Felhasználó'}!

Ez egy automatikus értesítés. Az alábbi tétel dokumentuma hamarosan lejár:

Modul: ${entity.module === 'personnel' ? 'Személyzet' : (entity.module === 'vehicles' ? 'Járművek' : entity.module)}
Név / Azonosító: ${entity.display_name}
Lejáró dokumentum/mező: ${fieldName}
Lejárat dátuma: ${item.value_date}
Hátralévő napok: ${diffDays}

Kérjük, gondoskodjon a megújításról!

(Ez az üzenet másolatban elküldésre került a vezetőknek).

Üdvözlettel,
AlApp Rendszer
            `.trim();

            emailsToSend.push({ to: recipientEmail, subject, body });
        }

        console.log(`Prepared ${emailsToSend.length} emails to send.`);

        // 6. Send Emails
        if (emailsToSend.length > 0) {
            console.log(`Connecting to SMTP server ${smtpHost}...`);
            await client.connectTLS({
                hostname: smtpHost,
                port: 465,
                username: smtpUser,
                password: smtpPass,
            });

            console.log('SMTP Connected. Sending emails...');

            const results = [];
            for (const mail of emailsToSend) {
                try {
                    // Combine TO and CC for visibility, but typically SMTP handles delivery separate from headers?
                    // SmtpClient 'send' takes `to` (string|array) and `cc` (string|array).
                    // We send ONE email per item.

                    await client.send({
                        from: smtpUser,
                        to: mail.to,
                        cc: ccList, // The list of admins/managers
                        subject: mail.subject,
                        content: mail.body,
                    });
                    console.log(`Email sent successfully (CC: ${ccList.length} admins)`);
                    results.push({ sent: true });
                } catch (e: unknown) {
                    const message = e instanceof Error ? e.message : String(e);
                    console.error(`Failed to send email:`, message);
                    results.push({ sent: false, error: message });
                }
            }

            await client.close();

            return new Response(
                JSON.stringify({
                    message: "Check complete",
                    sent_count: results.filter(r => r.sent).length,
                    details: results
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );

        } else {
            return new Response(JSON.stringify({ message: "No emails to send today" }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

    } catch (error: unknown) {
        console.error('Unexpected error:', error);
        return new Response(
            JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
    }
});
