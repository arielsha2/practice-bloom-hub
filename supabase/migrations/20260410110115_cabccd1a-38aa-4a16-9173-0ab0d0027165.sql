CREATE TABLE public.media_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.media_folders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage media folders" ON public.media_folders
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Course members can view media folders" ON public.media_folders
  FOR SELECT TO authenticated USING (is_course_member(auth.uid()));