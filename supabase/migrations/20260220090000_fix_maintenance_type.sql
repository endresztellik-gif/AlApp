-- Fix typo in maintenance_logs type constraint

ALTER TABLE public.maintenance_logs DROP CONSTRAINT IF EXISTS maintenance_logs_type_check;

ALTER TABLE public.maintenance_logs ADD CONSTRAINT maintenance_logs_type_check CHECK (type IN ('vizsga', 'szerviz', 'javitas', 'egyeb'));
