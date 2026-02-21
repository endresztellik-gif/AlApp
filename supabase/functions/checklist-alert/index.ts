import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { SmtpClient } from 'https://deno.land/x/smtp@v0.7.0/mod.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async () => {
  try {
    console.log("Checklist Alert Edge Function triggered by CRON...");

    // Find all checklists that have issues and haven't been notified yet
    const { data: checklists, error: fetchError } = await supabase
      .from('vehicle_checklists')
      .select(`
                id, vehicle_id, user_id, check_date,
                oil_ok, coolant_ok, lights_ok, bodywork_ok, bodywork_issue_description,
                entities:vehicle_id ( display_name ),
                user_profiles:user_id ( full_name )
            `)
      .eq('admin_notified', false)
      .or('oil_ok.eq.false,coolant_ok.eq.false,lights_ok.eq.false,bodywork_ok.eq.false');

    if (fetchError) throw fetchError;

    if (!checklists || checklists.length === 0) {
      console.log("No pending checklist issues found.");
      return new Response(JSON.stringify({ message: "No issues pending" }), { status: 200 });
    }

    console.log(`Found ${checklists.length} problematic checklists. Preparing emails...`);

    // Fetch admins to notify
    const { data: admins } = await supabase
      .from('user_profiles')
      .select('email')
      .eq('role', 'admin');

    const adminEmails = admins?.map(a => a.email).filter(e => e) || [];
    if (adminEmails.length === 0) {
      console.log("No admins found to notify.");
      return new Response(JSON.stringify({ message: "No admins" }), { status: 200 });
    }

    // SMTP Setup
    const smtpUser = Deno.env.get('SMTP_USER')!;
    const smtpPass = Deno.env.get('SMTP_PASS')!;

    const client = new SmtpClient();
    await client.connectTLS({
      hostname: "smtp.gmail.com",
      port: 465,
      username: smtpUser,
      password: smtpPass,
    });

    const notifiedIds: string[] = [];

    // Send email for each issue (or group them, but individual is safer for tracking)
    for (const record of checklists) {
      // @ts-expect-error nested entities type
      const vehicleName = record.entities?.display_name || 'Ismeretlen jármű';
      // @ts-expect-error nested user_profiles type
      const reporterName = record.user_profiles?.full_name || 'Ismeretlen rögzítő';

      let issueText = `Az alábbi rendszerhibák kerültek rögzítésre:\n\n`;
      if (!record.oil_ok) issueText += `- Motorolaj szint: HIBA\n`;
      if (!record.coolant_ok) issueText += `- Hűtőfolyadék: HIBA\n`;
      if (!record.lights_ok) issueText += `- Világítás és Index: HIBA\n`;
      if (!record.bodywork_ok) {
        issueText += `- Karosszéria: HIBA\n`;
        if (record.bodywork_issue_description) {
          issueText += `  Részletek: ${record.bodywork_issue_description}\n`;
        }
      }

      const dateStr = new Date(record.check_date).toLocaleString('hu-HU');

      const content = `Tisztelt Rendszergazda!\n\n` +
        `Új hibajelentés érkezett a kétheti kötelező ellenőrzés során.\n\n` +
        `Jármű: ${vehicleName}\n` +
        `Ellenőrzést végző: ${reporterName}\n` +
        `Időpont: ${dateStr}\n\n` +
        `${issueText}\n` +
        `Kérjük, ellenőrizze a rendszert a további intézkedésekhez.\n\n` +
        `Üdvözlettel,\nAlApp Rendszer`;

      await client.send({
        from: smtpUser,
        to: adminEmails.join(','),
        subject: `[AlApp] Riasztás: Jármű ellenőrzés hiba - ${vehicleName}`,
        content: content,
      });

      notifiedIds.push(record.id);
    }

    await client.close();

    // Mark them as notified
    if (notifiedIds.length > 0) {
      const { error: updateError } = await supabase
        .from('vehicle_checklists')
        .update({ admin_notified: true })
        .in('id', notifiedIds);

      if (updateError) throw updateError;
    }

    console.log("Alert emails sent successfully.");
    return new Response(JSON.stringify({ success: true, count: notifiedIds.length }), { status: 200, headers: { "Content-Type": "application/json" } });

  } catch (error) {
    console.error("Error processing checklist alerts:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
})
