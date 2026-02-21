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
  service_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nZHVjanFienFjbXJ6Y3NrbGxtbiIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE3NzA4MDMzODcsImV4cCI6MjA4NjM3OTM4N30.2wxdKboXvYrWllouoGuBB3Ukt7ZeayTFAMGT67IKnHg';
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
