-- Create content_categories table
CREATE TABLE public.content_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_he TEXT NOT NULL,
  name_en TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on content_categories
ALTER TABLE public.content_categories ENABLE ROW LEVEL SECURITY;

-- RLS policies for content_categories
CREATE POLICY "Anyone can read categories"
ON public.content_categories
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert categories"
ON public.content_categories
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update categories"
ON public.content_categories
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete categories"
ON public.content_categories
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default categories
INSERT INTO public.content_categories (name_he, name_en, slug, display_order) VALUES
('בניית קליניקה', 'Building a Practice', 'building-practice', 1),
('שיווק למטפלים', 'Marketing for Therapists', 'marketing', 2),
('תמחור ועסקים', 'Pricing & Business', 'pricing', 3),
('זהות מקצועית', 'Professional Identity', 'identity', 4),
('כללי', 'General', 'general', 5);

-- Expand contents table with new columns
ALTER TABLE public.contents 
ADD COLUMN category_id UUID REFERENCES public.content_categories(id),
ADD COLUMN status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
ADD COLUMN excerpt TEXT,
ADD COLUMN featured_image_url TEXT,
ADD COLUMN source TEXT DEFAULT 'manual',
ADD COLUMN original_id TEXT,
ADD COLUMN metadata JSONB DEFAULT '{}';

-- Drop the old is_published column and use status instead
-- First update any existing data
UPDATE public.contents SET status = CASE WHEN is_published = true THEN 'published' ELSE 'draft' END;

-- Create full-text search index for Hebrew and English
CREATE INDEX contents_search_idx ON public.contents 
USING GIN (to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(content, '')));

-- Create storage bucket for content images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('content-images', 'content-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for content-images bucket
CREATE POLICY "Anyone can view content images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'content-images');

CREATE POLICY "Admins can upload content images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'content-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update content images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'content-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete content images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'content-images' AND has_role(auth.uid(), 'admin'::app_role));