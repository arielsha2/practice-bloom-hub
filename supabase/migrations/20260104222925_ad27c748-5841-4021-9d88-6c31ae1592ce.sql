-- Step 1: Create ENUMs for media types
CREATE TYPE media_kind AS ENUM ('video', 'document', 'presentation', 'audio', 'link');
CREATE TYPE intended_use AS ENUM ('intro', 'practice', 'deepening', 'reference', 'bonus');

-- Step 2: Create media_library table
CREATE TABLE public.media_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic info
  title TEXT NOT NULL,
  description TEXT,
  
  -- Classification
  media_kind media_kind NOT NULL,
  file_format TEXT,
  
  -- File location
  file_path TEXT,
  url TEXT,
  source TEXT DEFAULT 'file',
  
  -- Video metadata
  external_id TEXT,
  duration_seconds INTEGER,
  thumbnail_url TEXT,
  
  -- Future-proofing
  tags TEXT[],
  intended_use intended_use,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Step 3: Create lesson_media_links table (junction table)
CREATE TABLE public.lesson_media_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  media_id UUID NOT NULL REFERENCES public.media_library(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(lesson_id, media_id)
);

-- Step 4: Enable RLS on new tables
ALTER TABLE public.media_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_media_links ENABLE ROW LEVEL SECURITY;

-- Step 5: RLS policies for media_library
CREATE POLICY "Admins can manage media library"
ON public.media_library
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Course members can view media library"
ON public.media_library
FOR SELECT
USING (is_course_member(auth.uid()));

-- Step 6: RLS policies for lesson_media_links
CREATE POLICY "Admins can manage lesson media links"
ON public.lesson_media_links
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Course members can view lesson media links"
ON public.lesson_media_links
FOR SELECT
USING (is_course_member(auth.uid()));

-- Step 7: Migrate existing data from lesson_resources to media_library
INSERT INTO public.media_library (title, media_kind, file_format, file_path, url, source, created_at)
SELECT 
  title,
  CASE 
    WHEN type = 'video' THEN 'video'::media_kind
    WHEN type = 'pdf' THEN 'document'::media_kind
    WHEN type = 'ppt' THEN 'presentation'::media_kind
    ELSE 'document'::media_kind
  END,
  CASE 
    WHEN type = 'pdf' THEN 'pdf'
    WHEN type = 'ppt' THEN 'pptx'
    WHEN type = 'video' AND file_path IS NOT NULL THEN 'mp4'
    ELSE NULL
  END,
  file_path,
  url,
  COALESCE(source, 'file'),
  created_at
FROM public.lesson_resources;

-- Step 8: Create lesson_media_links from existing lesson_resources
INSERT INTO public.lesson_media_links (lesson_id, media_id, display_order, created_at)
SELECT 
  lr.lesson_id,
  ml.id,
  ROW_NUMBER() OVER (PARTITION BY lr.lesson_id ORDER BY lr.created_at) - 1,
  lr.created_at
FROM public.lesson_resources lr
JOIN public.media_library ml ON ml.title = lr.title 
  AND COALESCE(ml.file_path, '') = COALESCE(lr.file_path, '')
  AND COALESCE(ml.url, '') = COALESCE(lr.url, '');

-- Step 9: Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_media_library_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_media_library_updated_at
BEFORE UPDATE ON public.media_library
FOR EACH ROW
EXECUTE FUNCTION public.update_media_library_updated_at();

-- Step 10: Create indexes for performance
CREATE INDEX idx_media_library_media_kind ON public.media_library(media_kind);
CREATE INDEX idx_lesson_media_links_lesson_id ON public.lesson_media_links(lesson_id);
CREATE INDEX idx_lesson_media_links_media_id ON public.lesson_media_links(media_id);