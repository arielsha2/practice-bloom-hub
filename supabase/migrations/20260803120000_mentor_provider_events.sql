CREATE TABLE public.mentor_provider_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  provider text NOT NULL,
  status_code integer,
  error_message text,
  fallback_used boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.mentor_provider_events TO authenticated;
GRANT ALL ON public.mentor_provider_events TO service_role;

ALTER TABLE public.mentor_provider_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view provider events"
  ON public.mentor_provider_events
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_mentor_provider_events_created ON public.mentor_provider_events (created_at DESC);
