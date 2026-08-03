CREATE POLICY "Users can log their own stuck point events"
  ON public.stuck_point_events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
