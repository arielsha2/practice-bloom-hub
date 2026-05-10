
CREATE TABLE IF NOT EXISTS public.therapist_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_user_id uuid NOT NULL,
  slug text NOT NULL,
  name text NOT NULL,
  phone text NOT NULL,
  message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_therapist_leads_user ON public.therapist_leads(therapist_user_id, created_at DESC);

ALTER TABLE public.therapist_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone_insert" ON public.therapist_leads;
CREATE POLICY "anyone_insert" ON public.therapist_leads
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "owner_select" ON public.therapist_leads;
CREATE POLICY "owner_select" ON public.therapist_leads
  FOR SELECT
  USING (auth.uid() = therapist_user_id OR has_role(auth.uid(), 'admin'));
