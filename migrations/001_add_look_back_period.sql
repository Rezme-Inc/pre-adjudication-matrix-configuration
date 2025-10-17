-- Migration: add look_back_period to decisions
ALTER TABLE public.decisions
ADD COLUMN IF NOT EXISTS look_back_period integer;

-- Optionally set a default (uncomment if desired):
-- ALTER TABLE public.decisions ALTER COLUMN look_back_period SET DEFAULT 3;