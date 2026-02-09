
-- Update default system_prompt
ALTER TABLE public.qa_ai_settings 
  ALTER COLUMN system_prompt 
  SET DEFAULT 'You are a mentor for psychotherapists. Your tone is professional, warm, and encouraging. You provide business and marketing advice that is ethical and authentic. Always respond in Hebrew.';

-- Update existing row
UPDATE public.qa_ai_settings 
  SET system_prompt = 'You are a mentor for psychotherapists. Your tone is professional, warm, and encouraging. You provide business and marketing advice that is ethical and authentic. Always respond in Hebrew.';

-- Create history table
CREATE TABLE public.qa_ai_settings_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  system_prompt text NOT NULL,
  model text NOT NULL,
  temperature numeric NOT NULL,
  max_tokens integer NOT NULL,
  changed_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.qa_ai_settings_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage prompt history"
  ON public.qa_ai_settings_history FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));
