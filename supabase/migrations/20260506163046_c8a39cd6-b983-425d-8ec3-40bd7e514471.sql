
CREATE TABLE IF NOT EXISTS public.therapist_journeys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  step_number integer NOT NULL DEFAULT 1,
  stuck_points text[] NOT NULL DEFAULT '{}',
  reflection jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.therapist_journeys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own journey"
ON public.therapist_journeys
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins view all journeys"
ON public.therapist_journeys
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_therapist_journeys_updated_at
BEFORE UPDATE ON public.therapist_journeys
FOR EACH ROW EXECUTE FUNCTION public.update_media_library_updated_at();
