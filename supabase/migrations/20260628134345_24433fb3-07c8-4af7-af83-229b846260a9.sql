CREATE OR REPLACE FUNCTION public.admin_list_unconfirmed_user_ids()
RETURNS TABLE(user_id uuid)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  RETURN QUERY
    SELECT u.id FROM auth.users u WHERE u.email_confirmed_at IS NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_unconfirmed_user_ids() TO authenticated;