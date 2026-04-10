
CREATE TABLE public.media_folder_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id uuid NOT NULL REFERENCES public.media_library(id) ON DELETE CASCADE,
  folder_id uuid NOT NULL REFERENCES public.media_folders(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(media_id, folder_id)
);

ALTER TABLE public.media_folder_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage media folder assignments"
  ON public.media_folder_assignments
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Course members can view media folder assignments"
  ON public.media_folder_assignments
  FOR SELECT TO authenticated
  USING (is_course_member(auth.uid()));

-- Migrate existing folder data from media_library.folder column
INSERT INTO public.media_folder_assignments (media_id, folder_id)
  SELECT ml.id, mf.id
  FROM public.media_library ml
  JOIN public.media_folders mf ON mf.name = ml.folder
  WHERE ml.folder IS NOT NULL;
