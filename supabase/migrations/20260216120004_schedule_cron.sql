-- Enable pg_cron extension
create extension if not exists pg_cron;

-- Schedule the 'check-expirations' function to run every day at 8:00 AM (Budapest time approx UTC+1/+2, let's set 07:00 UTC)
-- Note: Supabase pg_cron runs in UTC.
-- We invoke the Edge Function via HTTP. 
-- You need to replace 'YOUR_PROJECT_REF' and 'YOUR_ANON_KEY' with actual values or use net.http_post if enabled, 
-- but usually invoking internal functions via pg_net is better.
-- However, standard Supabase pattern for cron is often selecting from a function or using pg_net.

-- Simplest approach: Use a Postgres function that calls the Edge Function url.
-- Prerequisite: pg_net extension

create extension if not exists pg_net;

-- Function to invoke Edge Function
create or replace function invoke_check_expirations() -- Replace with your actual project URL and Service Role Key
returns void as $$
declare
  project_url text := 'https://mgducjqbzqcmrzcsklmn.supabase.co/functions/v1/check-expirations';
  -- SECURITY: Never store service_role keys in migration files.
  -- Set this via Supabase Vault or configure the cron job through the Supabase Dashboard UI.
  service_key text := current_setting('app.service_role_key', true);
begin
  -- Best practice: Use Vault or just rely on the fact that this SQL is internal.
  -- For this setup, we'll ask the user to configure the cron via Dashboard or we use a simplified placeholder.
  -- ACTUALLY: Supabase Dashboard has a UI for Cron Jobs which is safer than raw migration with keys.
  -- But we can write the SQL logic assuming the user replaces the keys.
  
  perform net.http_post(
      url := project_url,
      headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || service_key
      )
  );
end;
$$ language plpgsql;

-- Schedule it
-- select cron.schedule(
--   'check-expirations-daily',
--   '0 7 * * *', -- 7:00 UTC
--   $$ select invoke_check_expirations() $$
-- );

-- ─────────────────────────────────────────────────────────────
-- Személyes emlékeztető értesítések küldése (15 percenként)
-- ─────────────────────────────────────────────────────────────

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

select cron.schedule(
  'send-reminders-check',
  '*/15 * * * *',
  $$ select invoke_send_reminders() $$
);
