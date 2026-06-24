
-- 1. Add password_set column to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS password_set boolean NOT NULL DEFAULT false;

-- All existing users are assumed to already have a usable login path.
-- New users will be flagged as password_set = false explicitly via handle_new_user.
UPDATE public.profiles SET password_set = true;

-- 2. Update handle_new_user to set password_set = false for new signups
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
  INSERT INTO public.profiles (id, email, trial_start_date, display_name, mailing_list_consent, mailing_list_consent_at, password_set)
  VALUES (
    NEW.id,
    NEW.email,
    NULL,
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

-- 3. plan_changes audit table
CREATE TABLE IF NOT EXISTS public.plan_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  old_plan text,
  new_plan text NOT NULL,
  source text NOT NULL DEFAULT 'admin',
  changed_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.plan_changes TO authenticated;
GRANT ALL ON public.plan_changes TO service_role;

ALTER TABLE public.plan_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read plan_changes"
  ON public.plan_changes
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS plan_changes_user_id_idx ON public.plan_changes(user_id);
CREATE INDEX IF NOT EXISTS plan_changes_changed_at_idx ON public.plan_changes(changed_at DESC);

-- 4. Enable realtime on profiles
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'profiles'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles';
  END IF;
END $$;
