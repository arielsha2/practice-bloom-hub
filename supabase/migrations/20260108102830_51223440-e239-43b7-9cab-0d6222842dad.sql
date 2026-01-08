-- Update RLS policy to use status instead of is_published
DROP POLICY IF EXISTS "Anyone can read published contents" ON public.contents;

CREATE POLICY "Anyone can read published contents"
ON public.contents
FOR SELECT
USING (status = 'published');