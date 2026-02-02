-- 1. Create courses table
CREATE TABLE public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_key text UNIQUE NOT NULL,
  name_he text NOT NULL,
  name_en text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- RLS policies for courses
CREATE POLICY "Anyone can view active courses"
ON public.courses FOR SELECT
USING (is_active = true OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert courses"
ON public.courses FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update courses"
ON public.courses FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete courses"
ON public.courses FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- 2. Insert the existing course
INSERT INTO public.courses (course_key, name_he, name_en)
VALUES ('turning_point', 'נקודת מפנה', 'Turning Point');

-- 3. Add course_key to lessons table
ALTER TABLE public.lessons 
ADD COLUMN course_key text REFERENCES public.courses(course_key) DEFAULT 'turning_point';

-- 4. Create function to check course enrollment
CREATE OR REPLACE FUNCTION public.is_enrolled_in_course(_user_id uuid, _course_key text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.student_enrollments
    WHERE user_id = _user_id 
    AND course_key = _course_key
  ) OR has_role(_user_id, 'admin')
$$;

-- 5. Drop existing lesson policies and create new ones
DROP POLICY IF EXISTS "Admins can manage lessons" ON public.lessons;
DROP POLICY IF EXISTS "Course members can view lessons" ON public.lessons;

CREATE POLICY "Admins can manage lessons"
ON public.lessons FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Enrolled users can view lessons"
ON public.lessons FOR SELECT
USING (is_enrolled_in_course(auth.uid(), course_key));