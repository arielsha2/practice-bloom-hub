
-- Global flag: mentor trial open to all new signups
INSERT INTO public.app_settings (key, value)
VALUES ('mentor_trial_open_to_all', 'false')
ON CONFLICT (key) DO NOTHING;

-- Public read function so any client can check the flag
CREATE OR REPLACE FUNCTION public.is_mentor_trial_open()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT value = 'true' FROM public.app_settings WHERE key = 'mentor_trial_open_to_all'),
    false
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_mentor_trial_open() TO anon, authenticated;

-- Gate auto-trial for new signups on the global flag.
-- Admin can still manually grant a trial via profiles.trial_start_date (unchanged).
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
  v_trial_open boolean := public.is_mentor_trial_open();
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
    CASE
      WHEN v_has_paid_enrollment THEN NULL
      WHEN v_trial_open THEN now()
      ELSE NULL
    END,
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
