-- Add pending_mentor column to support granting mentor access to users via the "Add user" flow
ALTER TABLE public.student_enrollments
  ADD COLUMN IF NOT EXISTS pending_mentor BOOLEAN NOT NULL DEFAULT false;

-- Update the signup trigger to also grant mentor role when pending_mentor is true
CREATE OR REPLACE FUNCTION public.auto_assign_course_role_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  enrollment_record RECORD;
BEGIN
  FOR enrollment_record IN
    SELECT id, course_key, pending_role, pending_mentor
    FROM public.student_enrollments
    WHERE LOWER(email) = LOWER(NEW.email)
      AND user_id IS NULL
  LOOP
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, enrollment_record.pending_role::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;

    IF enrollment_record.pending_mentor THEN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.id, 'mentor'::app_role)
      ON CONFLICT (user_id, role) DO NOTHING;
    END IF;

    UPDATE public.student_enrollments
    SET user_id = NEW.id,
        activated_at = now()
    WHERE id = enrollment_record.id;
  END LOOP;

  RETURN NEW;
END;
$function$;

-- Update the enrollment trigger so admins adding a user whose email already exists immediately grants mentor
CREATE OR REPLACE FUNCTION public.auto_assign_course_role_on_enrollment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  existing_user RECORD;
BEGIN
  SELECT id INTO existing_user
  FROM public.profiles
  WHERE LOWER(email) = LOWER(NEW.email)
  LIMIT 1;

  IF FOUND THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (existing_user.id, 'course_member')
    ON CONFLICT (user_id, role) DO NOTHING;

    IF NEW.pending_mentor THEN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (existing_user.id, 'mentor'::app_role)
      ON CONFLICT (user_id, role) DO NOTHING;
    END IF;

    NEW.user_id = existing_user.id;
    NEW.activated_at = now();
  END IF;

  RETURN NEW;
END;
$function$;