CREATE OR REPLACE FUNCTION public.get_user_access(_user_id uuid)
 RETURNS TABLE(plan text, trial_active boolean, has_paid boolean, trial_ends_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    p.plan,
    (p.plan = 'free' AND p.trial_start_date IS NOT NULL AND now() < p.trial_start_date + interval '1 day') AS trial_active,
    (p.plan = 'paid' OR public.has_role(_user_id, 'admin')) AS has_paid,
    CASE WHEN p.trial_start_date IS NOT NULL THEN p.trial_start_date + interval '1 day' ELSE NULL END AS trial_ends_at
  FROM public.profiles p
  WHERE p.id = _user_id
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_consent boolean := COALESCE((NEW.raw_user_meta_data->>'mailing_list_consent')::boolean, false);
  v_name text := NULLIF(NEW.raw_user_meta_data->>'display_name', '');
  v_has_paid_enrollment boolean := false;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.student_enrollments
     WHERE LOWER(email) = LOWER(NEW.email)
       AND notes LIKE 'meshulam:%'
  ) INTO v_has_paid_enrollment;

  INSERT INTO public.profiles (id, email, trial_start_date, display_name, mailing_list_consent, mailing_list_consent_at, password_set)
  VALUES (
    NEW.id,
    NEW.email,
    CASE WHEN v_has_paid_enrollment THEN NULL ELSE now() END,
    v_name,
    v_consent,
    CASE WHEN v_consent THEN now() ELSE NULL END,
    false
  )
  ON CONFLICT (id) DO UPDATE
    SET display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name),
        mailing_list_consent = public.profiles.mailing_list_consent OR EXCLUDED.mailing_list_consent,
        mailing_list_consent_at = COALESCE(public.profiles.mailing_list_consent_at, EXCLUDED.mailing_list_consent_at);
  RETURN NEW;
END;
$function$;