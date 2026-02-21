-- Migration file to add permit_file_path to water_facilities
-- Created at: 2026-02-17
-- Description: Adds a column to store the path of the uploaded water permit document.

ALTER TABLE public.water_facilities
ADD COLUMN IF NOT EXISTS permit_file_path TEXT;
