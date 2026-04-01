-- Havi audit napló export – Edge Function cron ütemező
-- Minden hónap 1-jén 06:00 UTC-kor fut le

CREATE OR REPLACE FUNCTION invoke_export_audit_logs()
RETURNS void AS $$
DECLARE
    project_url TEXT := 'https://mgducjqbzqcmrzcsklmn.supabase.co/functions/v1/export-audit-logs';
    service_key TEXT := current_setting('app.service_role_key', true);
BEGIN
    PERFORM net.http_post(
        url     := project_url,
        headers := jsonb_build_object(
            'Content-Type',  'application/json',
            'Authorization', 'Bearer ' || service_key
        )
    );
END;
$$ LANGUAGE plpgsql;

SELECT cron.schedule(
    'monthly-audit-export',
    '0 6 1 * *',
    $$ SELECT invoke_export_audit_logs() $$
);
