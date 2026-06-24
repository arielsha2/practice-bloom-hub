CREATE TABLE public.user_ai_keys (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'gemini',
  encrypted_key TEXT NOT NULL,
  key_hint TEXT NOT NULL,
  last_validated_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.user_ai_keys TO authenticated;
GRANT ALL ON public.user_ai_keys TO service_role;

ALTER TABLE public.user_ai_keys ENABLE ROW LEVEL SECURITY;

-- Users can read their own row metadata (key_hint, validated_at, last_error) — encrypted_key
-- is technically exposed to the row owner, but it's encrypted and unusable client-side.
CREATE POLICY "Users can view their own AI key row"
  ON public.user_ai_keys FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- All writes go through the save-user-ai-key edge function (service role).
-- No insert/update/delete policies for authenticated users.

CREATE TRIGGER update_user_ai_keys_updated_at
  BEFORE UPDATE ON public.user_ai_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();