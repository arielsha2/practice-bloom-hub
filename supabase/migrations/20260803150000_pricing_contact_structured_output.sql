ALTER TABLE public.therapist_journeys
  ADD COLUMN IF NOT EXISTS pricing_output jsonb,
  ADD COLUMN IF NOT EXISTS contact_finder_output jsonb;
