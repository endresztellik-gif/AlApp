-- Enable pg_cron and pg_net extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create the cron job to call the Edge Function
-- Runs at 00:00 on day-of-month 1 and 15 (Bi-weekly)
SELECT cron.schedule(
  'database-biweekly-backup',
  '0 0 1,15 * *',
  $$
    SELECT net.http_post(
      url:='https://mgducjqbzqcmrzcsklmn.supabase.co/functions/v1/database-backup',
      headers:=jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body:=jsonb_build_object('source', 'cron')
    )
  $$
);
