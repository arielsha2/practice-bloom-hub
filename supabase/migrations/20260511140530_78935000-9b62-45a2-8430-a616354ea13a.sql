CREATE TABLE IF NOT EXISTS public.mentor_ai_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  system_prompt_he text NOT NULL,
  system_prompt_en text NOT NULL,
  model text NOT NULL DEFAULT 'google/gemini-2.5-flash',
  temperature numeric NOT NULL DEFAULT 0.7,
  max_tokens integer NOT NULL DEFAULT 2000,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid
);
ALTER TABLE public.mentor_ai_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage mentor settings" ON public.mentor_ai_settings
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated read mentor settings" ON public.mentor_ai_settings
  FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.mentor_ai_settings_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  system_prompt_he text NOT NULL,
  system_prompt_en text NOT NULL,
  model text NOT NULL,
  temperature numeric NOT NULL,
  max_tokens integer NOT NULL,
  changed_by uuid,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.mentor_ai_settings_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage mentor history" ON public.mentor_ai_settings_history
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));