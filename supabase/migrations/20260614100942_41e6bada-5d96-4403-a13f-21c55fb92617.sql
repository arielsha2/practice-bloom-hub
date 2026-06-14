
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS mailing_list_consent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS mailing_list_consent_at timestamptz;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_consent boolean := COALESCE((NEW.raw_user_meta_data->>'mailing_list_consent')::boolean, false);
  v_name text := NULLIF(NEW.raw_user_meta_data->>'display_name', '');
BEGIN
  INSERT INTO public.profiles (id, email, trial_start_date, display_name, mailing_list_consent, mailing_list_consent_at)
  VALUES (
    NEW.id,
    NEW.email,
    now(),
    v_name,
    v_consent,
    CASE WHEN v_consent THEN now() ELSE NULL END
  )
  ON CONFLICT (id) DO UPDATE
    SET trial_start_date = COALESCE(public.profiles.trial_start_date, now()),
        display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name),
        mailing_list_consent = public.profiles.mailing_list_consent OR EXCLUDED.mailing_list_consent,
        mailing_list_consent_at = COALESCE(public.profiles.mailing_list_consent_at, EXCLUDED.mailing_list_consent_at);
  RETURN NEW;
END;
$function$;
