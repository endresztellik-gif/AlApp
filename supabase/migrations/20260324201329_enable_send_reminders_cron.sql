
-- Enable required extensions
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Function to invoke send-reminders Edge Function
create or replace function invoke_send_reminders()
returns void as $$
declare
  project_url text := 'https://mgducjqbzqcmrzcsklmn.supabase.co/functions/v1/send-reminders';
  service_key text := current_setting('app.service_role_key', true);
begin
  perform net.http_post(
    url := project_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    )
  );
end;
$$ language plpgsql;

-- Schedule every 15 minutes (idempotent: unschedule first if exists)
select cron.unschedule('send-reminders-check') where exists (
  select 1 from cron.job where jobname = 'send-reminders-check'
);

select cron.schedule(
  'send-reminders-check',
  '*/15 * * * *',
  $$ select invoke_send_reminders() $$
);
