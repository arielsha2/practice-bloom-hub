CREATE TABLE public.mentor_notebooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mentor_notebooks TO authenticated;
GRANT ALL ON public.mentor_notebooks TO service_role;

ALTER TABLE public.mentor_notebooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notebook"
  ON public.mentor_notebooks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notebook"
  ON public.mentor_notebooks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notebook"
  ON public.mentor_notebooks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notebook"
  ON public.mentor_notebooks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER mentor_notebooks_set_updated_at
  BEFORE UPDATE ON public.mentor_notebooks
  FOR EACH ROW EXECUTE FUNCTION public.update_media_library_updated_at();