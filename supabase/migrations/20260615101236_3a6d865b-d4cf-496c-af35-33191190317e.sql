CREATE OR REPLACE FUNCTION public.upgrade_mentor_to_paid()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'mentor' THEN
    UPDATE public.profiles
       SET plan = 'paid',
           trial_start_date = NULL,
           trial_reminder_sent_at = NULL,
           plan_updated_at = now()
     WHERE id = NEW.user_id
       AND plan IS DISTINCT FROM 'paid';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_roles_mentor_upgrade ON public.user_roles;
CREATE TRIGGER trg_user_roles_mentor_upgrade
AFTER INSERT ON public.user_roles
FOR EACH ROW
WHEN (NEW.role = 'mentor')
EXECUTE FUNCTION public.upgrade_mentor_to_paid();