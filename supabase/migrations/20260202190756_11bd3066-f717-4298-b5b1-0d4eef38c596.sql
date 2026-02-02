-- Create cohorts table
CREATE TABLE public.cohorts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_he text NOT NULL,
  name_en text NOT NULL,
  start_date date,
  end_date date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cohorts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cohorts
CREATE POLICY "Anyone can view active cohorts"
ON public.cohorts FOR SELECT
USING (is_active = true OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage cohorts"
ON public.cohorts FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Add cohort_id to courses
ALTER TABLE public.courses 
ADD COLUMN cohort_id uuid REFERENCES public.cohorts(id);

-- Add cohort_id to student_enrollments
ALTER TABLE public.student_enrollments 
ADD COLUMN cohort_id uuid REFERENCES public.cohorts(id);

-- Create first cohort
INSERT INTO public.cohorts (name_he, name_en)
VALUES ('מחזור א׳', 'Cohort A');

-- Link existing course to first cohort
UPDATE public.courses 
SET cohort_id = (SELECT id FROM public.cohorts WHERE name_en = 'Cohort A' LIMIT 1)
WHERE cohort_id IS NULL;