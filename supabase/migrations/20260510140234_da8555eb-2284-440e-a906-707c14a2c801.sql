
-- Part 1a: add structured output columns
ALTER TABLE public.therapist_journeys
  ADD COLUMN IF NOT EXISTS niche_output jsonb,
  ADD COLUMN IF NOT EXISTS self_presentation_output jsonb;

-- Part 2: therapist_websites
CREATE TABLE IF NOT EXISTS public.therapist_websites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  slug text UNIQUE NOT NULL,
  is_published boolean NOT NULL DEFAULT false,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  contact_method text NOT NULL DEFAULT 'form' CHECK (contact_method IN ('form','calendar')),
  calendar_link text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_therapist_websites_user ON public.therapist_websites(user_id);
CREATE INDEX IF NOT EXISTS idx_therapist_websites_slug ON public.therapist_websites(slug);

ALTER TABLE public.therapist_websites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_all" ON public.therapist_websites;
CREATE POLICY "owner_all" ON public.therapist_websites
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "public_read_published" ON public.therapist_websites;
CREATE POLICY "public_read_published" ON public.therapist_websites
  FOR SELECT
  USING (is_published = true);

CREATE TRIGGER trg_therapist_websites_updated_at
  BEFORE UPDATE ON public.therapist_websites
  FOR EACH ROW EXECUTE FUNCTION public.update_media_library_updated_at();

-- Part 3: storage bucket for therapist website assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('therapist-websites', 'therapist-websites', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "tw_public_read" ON storage.objects;
CREATE POLICY "tw_public_read" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'therapist-websites');

DROP POLICY IF EXISTS "tw_owner_insert" ON storage.objects;
CREATE POLICY "tw_owner_insert" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'therapist-websites'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "tw_owner_update" ON storage.objects;
CREATE POLICY "tw_owner_update" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'therapist-websites'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "tw_owner_delete" ON storage.objects;
CREATE POLICY "tw_owner_delete" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'therapist-websites'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
