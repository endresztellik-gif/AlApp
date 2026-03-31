
CREATE OR REPLACE FUNCTION invoke_equipment_checkout_reminder()
RETURNS void AS $$
DECLARE
    project_url TEXT := 'https://mgducjqbzqcmrzcsklmn.supabase.co/functions/v1/equipment-checkout-reminder';
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
    'equipment-checkout-reminder-daily',
    '0 16 * * *',
    $$ SELECT invoke_equipment_checkout_reminder() $$
);
