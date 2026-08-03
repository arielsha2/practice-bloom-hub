CREATE TABLE public.stuck_point_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  stage text,
  category text NOT NULL,
  text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.stuck_point_events TO authenticated;
GRANT ALL ON public.stuck_point_events TO service_role;

ALTER TABLE public.stuck_point_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view stuck point events"
  ON public.stuck_point_events
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_stuck_point_events_category ON public.stuck_point_events (category, created_at DESC);
CREATE INDEX idx_stuck_point_events_user ON public.stuck_point_events (user_id, created_at DESC);
