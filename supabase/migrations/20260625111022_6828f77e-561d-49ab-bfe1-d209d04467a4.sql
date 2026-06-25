CREATE POLICY "Admins can view all AI key metadata"
  ON public.user_ai_keys
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));