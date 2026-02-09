
-- Settings table for QA AI configuration (single row)
CREATE TABLE public.qa_ai_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  system_prompt text NOT NULL DEFAULT 'You are a helpful teaching assistant. Answer student questions clearly and concisely based on the course material.',
  model text NOT NULL DEFAULT 'google/gemini-3-flash-preview',
  temperature numeric NOT NULL DEFAULT 0.7,
  max_tokens integer NOT NULL DEFAULT 1000,
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.qa_ai_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage QA AI settings"
  ON public.qa_ai_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Course members can read QA AI settings"
  ON public.qa_ai_settings FOR SELECT
  USING (is_course_member(auth.uid()));

-- Insert default row
INSERT INTO public.qa_ai_settings (system_prompt) VALUES (
  'You are a helpful teaching assistant for a professional development course. Answer student questions clearly, concisely, and supportively. If you are unsure about something, say so rather than guessing.'
);
