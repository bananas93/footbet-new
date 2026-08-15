-- Adds explicit regulation slot fields for tournament table zones.
-- Run in Supabase SQL editor for each environment.

ALTER TABLE public.tournaments
  ADD COLUMN IF NOT EXISTS champions_slots integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS europa_slots integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS relegation_slots integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.tournaments.champions_slots IS 'Top slots marked as Champions League zone in standings';
COMMENT ON COLUMN public.tournaments.europa_slots IS 'Next slots marked as Europe League zone in standings';
COMMENT ON COLUMN public.tournaments.relegation_slots IS 'Bottom slots marked as relegation zone in standings';
