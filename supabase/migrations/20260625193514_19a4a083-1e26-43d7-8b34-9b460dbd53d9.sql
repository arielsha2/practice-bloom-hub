
CREATE TABLE public.mentor_testimonials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  language TEXT NOT NULL CHECK (language IN ('he','en')),
  kind TEXT NOT NULL CHECK (kind IN ('text','image')),
  body_text TEXT,
  author TEXT,
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.mentor_testimonials TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.mentor_testimonials TO authenticated;
GRANT ALL ON public.mentor_testimonials TO service_role;

ALTER TABLE public.mentor_testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active mentor testimonials"
  ON public.mentor_testimonials FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can read all mentor testimonials"
  ON public.mentor_testimonials FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert mentor testimonials"
  ON public.mentor_testimonials FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update mentor testimonials"
  ON public.mentor_testimonials FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete mentor testimonials"
  ON public.mentor_testimonials FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX mentor_testimonials_lang_active_idx
  ON public.mentor_testimonials (language, is_active, sort_order);

CREATE TRIGGER mentor_testimonials_updated_at
  BEFORE UPDATE ON public.mentor_testimonials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage policies for the mentor-testimonials bucket (bucket created via tool)
CREATE POLICY "Public read mentor testimonial images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'mentor-testimonials');

CREATE POLICY "Admins upload mentor testimonial images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'mentor-testimonials' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update mentor testimonial images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'mentor-testimonials' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete mentor testimonial images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'mentor-testimonials' AND public.has_role(auth.uid(), 'admin'));
