import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";
import { zipSync, strToU8 } from "https://esm.sh/fflate@0.8.2";
import { getCorsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
    const corsHeaders = getCorsHeaders(req);
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        console.log("Starting database-backup function...");

        // 1. Initialize Supabase
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // 2. Fetch Data from Core Tables
        console.log("Fetching core tables...");

        const fetchData = async (table: string) => {
            const { data, error } = await supabase.from(table).select('*');
            if (error) {
                console.error(`Error fetching ${table}:`, error.message);
                return [];
            }
            return data;
        };

        const [
            userProfiles,
            entities,
            fieldValues,
            incidents,
            maintenanceLogs,
            vehicleChecklists
        ] = await Promise.all([
            fetchData('user_profiles'),
            fetchData('entities'),
            fetchData('field_values'),
            fetchData('incidents'),
            fetchData('maintenance_logs'),
            fetchData('vehicle_checklists')
        ]);

        const backupData = {
            timestamp: new Date().toISOString(),
            user_profiles: userProfiles,
            entities: entities,
            field_values: fieldValues,
            incidents: incidents,
            maintenance_logs: maintenanceLogs,
            vehicle_checklists: vehicleChecklists
        };

        // 3. Compress Data to ZIP
        console.log("Compressing data to ZIP...");
        const jsonString = JSON.stringify(backupData, null, 2);
        const zipFile = zipSync({
            'alapp_backup.json': strToU8(jsonString)
        });

        const currentDate = new Date().toISOString().split('T')[0];
        const fileName = `alapp_${currentDate}.zip`;
        const storagePath = `backups/${fileName}`;

        // 4. Upload to Supabase Storage (secure, not sent via email)
        console.log("Uploading backup to Supabase Storage...");
        const { error: uploadError } = await supabase.storage
            .from('database-backups')
            .upload(storagePath, zipFile, {
                contentType: 'application/zip',
                upsert: true,
            });

        if (uploadError) {
            console.error("Storage upload failed:", uploadError.message);
            throw new Error(`Storage upload failed: ${uploadError.message}`);
        }

        // 5. Generate time-limited signed URL (valid for 24 hours)
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
            .from('database-backups')
            .createSignedUrl(storagePath, 60 * 60 * 24); // 24 hours

        if (signedUrlError) {
            throw new Error(`Failed to create signed URL: ${signedUrlError.message}`);
        }

        const downloadUrl = signedUrlData.signedUrl;

        // 6. Send notification email with download link (NOT the actual data)
        const smtpUser = Deno.env.get('SMTP_USER');
        const smtpPass = Deno.env.get('SMTP_PASS');
        const smtpHost = 'smtp.gmail.com';

        if (!smtpUser || !smtpPass) {
            throw new Error('Missing SMTP_USER or SMTP_PASS environment variables.');
        }

        const { data: admins, error: adminError } = await supabase
            .from('user_profiles')
            .select('email')
            .eq('role', 'admin');

        if (adminError) throw adminError;

        const recipientEmails = [...new Set(admins?.map(u => u.email).filter(e => e))] as string[];

        if (recipientEmails.length === 0) {
            throw new Error("No admin emails found to send the notification to.");
        }

        console.log(`Sending backup notification to ${recipientEmails.length} admin(s)`);

        const client = new SmtpClient();
        await client.connectTLS({
            hostname: smtpHost,
            port: 465,
            username: smtpUser,
            password: smtpPass,
        });

        await client.send({
            from: smtpUser,
            to: recipientEmails[0],
            cc: recipientEmails.slice(1),
            subject: `[AlApp] Biztonsagi Mentes - ${currentDate}`,
            content: `Kedves Rendszergazda!\n\nAz AlApp adatbazisanak biztonsagi mentese elkeszult (${currentDate}).\n\nA mentes letoltheto az alabbi linkrol (24 oraig ervenyes):\n${downloadUrl}\n\nA fajl tartalmazza az osszes szemely, jarmu, eszkoz, naplo es incidens adatat ZIP/JSON formatumban.\n\nUdvozlettel,\nAlApp Rendszer`,
        });

        await client.close();

        console.log("Database backup completed successfully.");

        return new Response(
            JSON.stringify({ message: "Backup generated, stored securely, and notification sent." }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Backup Error:', message);
        return new Response(
            JSON.stringify({ error: message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
    }
});
