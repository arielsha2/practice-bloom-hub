-- Add scheduled_publish_at column to contents table
ALTER TABLE public.contents ADD COLUMN IF NOT EXISTS scheduled_publish_at TIMESTAMPTZ;

-- Create content_tags table
CREATE TABLE IF NOT EXISTS public.content_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_he TEXT NOT NULL,
  name_en TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create content_tag_links table (many-to-many)
CREATE TABLE IF NOT EXISTS public.content_tag_links (
  content_id UUID REFERENCES public.contents(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES public.content_tags(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (content_id, tag_id)
);

-- Enable RLS on new tables
ALTER TABLE public.content_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_tag_links ENABLE ROW LEVEL SECURITY;

-- RLS policies for content_tags
CREATE POLICY "Anyone can read tags" ON public.content_tags FOR SELECT USING (true);
CREATE POLICY "Admins can insert tags" ON public.content_tags FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update tags" ON public.content_tags FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete tags" ON public.content_tags FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for content_tag_links
CREATE POLICY "Anyone can read tag links" ON public.content_tag_links FOR SELECT USING (true);
CREATE POLICY "Admins can insert tag links" ON public.content_tag_links FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete tag links" ON public.content_tag_links FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Update contents RLS policy to include scheduled articles for admins
DROP POLICY IF EXISTS "Anyone can read published contents" ON public.contents;
CREATE POLICY "Anyone can read published contents or admins see all" ON public.contents FOR SELECT 
USING (status = 'published' OR has_role(auth.uid(), 'admin'::app_role));