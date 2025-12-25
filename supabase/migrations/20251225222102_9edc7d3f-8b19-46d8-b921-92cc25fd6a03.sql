-- Create lessons table
CREATE TABLE public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lesson_resources table (unified for video/pdf/ppt)
CREATE TABLE public.lesson_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('video', 'pdf', 'ppt')),
  file_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create qa_threads table
CREATE TABLE public.qa_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  question TEXT NOT NULL,
  answer TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  answered_at TIMESTAMP WITH TIME ZONE
);

-- Create helper function to check course membership
CREATE OR REPLACE FUNCTION public.is_course_member(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id 
    AND role IN ('course_member', 'admin')
  )
$$;

-- Enable RLS on all tables
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qa_threads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lessons
CREATE POLICY "Course members can view lessons"
ON public.lessons FOR SELECT
USING (public.is_course_member(auth.uid()));

CREATE POLICY "Admins can manage lessons"
ON public.lessons FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for lesson_resources
CREATE POLICY "Course members can view resources"
ON public.lesson_resources FOR SELECT
USING (public.is_course_member(auth.uid()));

CREATE POLICY "Admins can manage resources"
ON public.lesson_resources FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for qa_threads
CREATE POLICY "Course members can view public questions and own questions"
ON public.qa_threads FOR SELECT
USING (
  public.is_course_member(auth.uid()) AND (
    is_public = true OR 
    user_id = auth.uid() OR 
    public.has_role(auth.uid(), 'admin')
  )
);

CREATE POLICY "Course members can ask questions"
ON public.qa_threads FOR INSERT
WITH CHECK (
  public.is_course_member(auth.uid()) AND 
  user_id = auth.uid()
);

CREATE POLICY "Admins can manage questions"
ON public.qa_threads FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete questions"
ON public.qa_threads FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Create storage bucket for course materials
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-materials', 'course-materials', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
CREATE POLICY "Course members can view course materials"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'course-materials' AND 
  public.is_course_member(auth.uid())
);

CREATE POLICY "Admins can upload course materials"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'course-materials' AND 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can update course materials"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'course-materials' AND 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete course materials"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'course-materials' AND 
  public.has_role(auth.uid(), 'admin')
);