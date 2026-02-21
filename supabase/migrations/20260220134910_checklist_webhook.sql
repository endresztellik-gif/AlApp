-- Add tracking column
ALTER TABLE public.vehicle_checklists 
ADD COLUMN IF NOT EXISTS admin_notified BOOLEAN DEFAULT false;

-- Create pg_cron job to run the alert function every 5 minutes
SELECT cron.schedule(
  'checklist-alert-job', 
  '*/5 * * * *', 
  $$
    SELECT net.http_post(
      url:='https://mgducjqbzqcmrzcsklmn.supabase.co/functions/v1/checklist-alert',
      headers:=jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', current_setting('request.jwt.claim.role', true)
      ),
      body:=jsonb_build_object('source', 'pg_cron')
    );
  $$
);
