
-- 1. Extend profiles with plan/trial columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS trial_start_date timestamptz,
  ADD COLUMN IF NOT EXISTS plan_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS meshulam_transaction_id text;

-- 2. Constraint + unique index
DO $$ BEGIN
  ALTER TABLE public.profiles ADD CONSTRAINT profiles_plan_check CHECK (plan IN ('free','paid'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_meshulam_tx_unique
  ON public.profiles(meshulam_transaction_id)
  WHERE meshulam_transaction_id IS NOT NULL;

-- 3. Backfill trial_start_date for existing users so they aren't stuck without a trial window
UPDATE public.profiles
  SET trial_start_date = COALESCE(trial_start_date, created_at, now())
  WHERE trial_start_date IS NULL;

-- 4. RLS: ensure users can read their own profile (existing policies likely cover this; add WITH CHECK guard so users cannot self-promote to paid)
-- Drop & recreate a user-update policy that blocks plan/trial column writes from clients
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can update own profile (no plan)" ON public.profiles;
END $$;

CREATE POLICY "Users can update own profile (no plan)"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND plan = (SELECT p.plan FROM public.profiles p WHERE p.id = auth.uid())
    AND COALESCE(meshulam_transaction_id, '') = COALESCE((SELECT p.meshulam_transaction_id FROM public.profiles p WHERE p.id = auth.uid()), '')
  );

-- 5. get_user_access RPC — single source of truth
CREATE OR REPLACE FUNCTION public.get_user_access(_user_id uuid)
RETURNS TABLE(plan text, trial_active boolean, has_paid boolean, trial_ends_at timestamptz)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.plan,
    (p.plan = 'free' AND p.trial_start_date IS NOT NULL AND now() < p.trial_start_date + interval '8 days') AS trial_active,
    (p.plan = 'paid' OR public.has_role(_user_id, 'admin')) AS has_paid,
    CASE WHEN p.trial_start_date IS NOT NULL THEN p.trial_start_date + interval '8 days' ELSE NULL END AS trial_ends_at
  FROM public.profiles p
  WHERE p.id = _user_id
$$;

GRANT EXECUTE ON FUNCTION public.get_user_access(uuid) TO authenticated, service_role;

-- 6. Update handle_new_user to stamp trial_start_date
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, trial_start_date)
  VALUES (NEW.id, NEW.email, now())
  ON CONFLICT (id) DO UPDATE
    SET trial_start_date = COALESCE(public.profiles.trial_start_date, now());
  RETURN NEW;
END;
$$;

-- 7. Extend enrollment auto-assign to also flip plan to 'paid' for paid enrollments
CREATE OR REPLACE FUNCTION public.auto_assign_course_role_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  enrollment_record RECORD;
  has_paid_enrollment boolean := false;
BEGIN
  FOR enrollment_record IN
    SELECT id, course_key, pending_role, pending_mentor, notes
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

    IF enrollment_record.notes LIKE 'meshulam:%' THEN
      has_paid_enrollment := true;
    END IF;

    UPDATE public.student_enrollments
    SET user_id = NEW.id, activated_at = now()
    WHERE id = enrollment_record.id;
  END LOOP;

  IF has_paid_enrollment THEN
    UPDATE public.profiles
      SET plan = 'paid', plan_updated_at = now()
      WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;
