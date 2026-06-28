
CREATE TABLE public.mentor_handoff_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  conversation_id uuid,
  bot_key text NOT NULL,
  source text NOT NULL,
  status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.mentor_handoff_events TO authenticated;
GRANT ALL ON public.mentor_handoff_events TO service_role;

ALTER TABLE public.mentor_handoff_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own handoff events"
  ON public.mentor_handoff_events
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_mentor_handoff_events_user_created
  ON public.mentor_handoff_events (user_id, created_at DESC);
CREATE INDEX idx_mentor_handoff_events_status_created
  ON public.mentor_handoff_events (status, created_at DESC);
