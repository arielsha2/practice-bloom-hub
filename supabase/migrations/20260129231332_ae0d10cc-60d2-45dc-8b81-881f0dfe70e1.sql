-- =============================================
-- Student Enrollments System (Email Whitelist)
-- =============================================

-- 1. Create the student_enrollments table
CREATE TABLE public.student_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  full_name text,
  course_key text NOT NULL DEFAULT 'turning_point',
  enrolled_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  activated_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(email, course_key)
);

-- 2. Create indexes for fast lookups
CREATE INDEX idx_student_enrollments_email ON public.student_enrollments(email);
CREATE INDEX idx_student_enrollments_user_id ON public.student_enrollments(user_id);

-- 3. Enable RLS
ALTER TABLE public.student_enrollments ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Admins can manage all enrollments
CREATE POLICY "Admins can manage enrollments"
  ON public.student_enrollments
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Users can view their own enrollments (by matching email)
CREATE POLICY "Users can view own enrollments"
  ON public.student_enrollments
  FOR SELECT
  USING (
    LOWER(email) = LOWER((SELECT email FROM public.profiles WHERE id = auth.uid()))
  );

-- 5. Trigger function to normalize email to lowercase
CREATE OR REPLACE FUNCTION public.normalize_enrollment_email()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.email = LOWER(TRIM(NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER normalize_email_before_save
  BEFORE INSERT OR UPDATE ON public.student_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_enrollment_email();

-- 6. Trigger function: When new profile is created, check if email is in enrollments
CREATE OR REPLACE FUNCTION public.auto_assign_course_role_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  enrollment_record RECORD;
BEGIN
  -- Check if email exists in student_enrollments (case insensitive)
  FOR enrollment_record IN
    SELECT id, course_key
    FROM public.student_enrollments
    WHERE LOWER(email) = LOWER(NEW.email)
      AND user_id IS NULL
  LOOP
    -- Add course_member role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'course_member')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Update the enrollment record with user_id and activation time
    UPDATE public.student_enrollments
    SET user_id = NEW.id,
        activated_at = now()
    WHERE id = enrollment_record.id;
  END LOOP;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created_check_enrollment
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_course_role_on_signup();

-- 7. Trigger function: When enrollment is added, check if user already exists
CREATE OR REPLACE FUNCTION public.auto_assign_course_role_on_enrollment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_user RECORD;
BEGIN
  -- Check if a user with this email already exists in profiles
  SELECT id INTO existing_user
  FROM public.profiles
  WHERE LOWER(email) = LOWER(NEW.email)
  LIMIT 1;
  
  IF FOUND THEN
    -- Add course_member role to existing user
    INSERT INTO public.user_roles (user_id, role)
    VALUES (existing_user.id, 'course_member')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Update the enrollment record
    NEW.user_id = existing_user.id;
    NEW.activated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_enrollment_check_existing_user
  BEFORE INSERT ON public.student_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_course_role_on_enrollment();