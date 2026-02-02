-- Add pending_role column to student_enrollments
ALTER TABLE public.student_enrollments 
ADD COLUMN IF NOT EXISTS pending_role text DEFAULT 'course_member';

-- Update the trigger function to support pending_role assignment
CREATE OR REPLACE FUNCTION public.auto_assign_course_role_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  enrollment_record RECORD;
BEGIN
  -- Check if email exists in student_enrollments (case insensitive)
  FOR enrollment_record IN
    SELECT id, course_key, pending_role
    FROM public.student_enrollments
    WHERE LOWER(email) = LOWER(NEW.email)
      AND user_id IS NULL
  LOOP
    -- Add the pending role (admin or course_member)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, enrollment_record.pending_role::app_role)
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