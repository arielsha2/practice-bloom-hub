CREATE TABLE public.mentor_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id uuid NOT NULL DEFAULT gen_random_uuid(),
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  insight_count integer NOT NULL DEFAULT 0,
  stage text,
  started_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mentor_conversations TO authenticated;
GRANT ALL ON public.mentor_conversations TO service_role;

ALTER TABLE public.mentor_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own mentor conversations"
  ON public.mentor_conversations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mentor conversations"
  ON public.mentor_conversations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mentor conversations"
  ON public.mentor_conversations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own mentor conversations"
  ON public.mentor_conversations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_mentor_conversations_user_id ON public.mentor_conversations(user_id);
CREATE INDEX idx_mentor_conversations_session_id ON public.mentor_conversations(session_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_mentor_conversations_updated_at
  BEFORE UPDATE ON public.mentor_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();