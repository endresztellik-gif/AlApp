-- Fix foreign key so PostgREST can automatically join user_profiles

ALTER TABLE public.maintenance_logs DROP CONSTRAINT IF EXISTS maintenance_logs_user_id_fkey;

ALTER TABLE public.maintenance_logs ADD CONSTRAINT maintenance_logs_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;
