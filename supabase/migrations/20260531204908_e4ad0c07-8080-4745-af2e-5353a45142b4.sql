-- Allow mentor-only enrollments (no course, no student role)
ALTER TABLE public.student_enrollments
  ALTER COLUMN course_key DROP NOT NULL;

ALTER TABLE public.student_enrollments
  ALTER COLUMN pending_role DROP DEFAULT;

-- Update signup trigger to skip role insert when pending_role is NULL
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
    IF enrollment_record.pending_role IS NOT NULL THEN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.id, enrollment_record.pending_role::app_role)
      ON CONFLICT (user_id, role) DO NOTHING;
    END IF;

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

-- Update enrollment trigger: only add course_member role when a course is actually attached
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
    IF NEW.course_key IS NOT NULL AND COALESCE(NEW.pending_role, 'course_member') = 'course_member' THEN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (existing_user.id, 'course_member')
      ON CONFLICT (user_id, role) DO NOTHING;
    ELSIF NEW.pending_role IS NOT NULL THEN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (existing_user.id, NEW.pending_role::app_role)
      ON CONFLICT (user_id, role) DO NOTHING;
    END IF;

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