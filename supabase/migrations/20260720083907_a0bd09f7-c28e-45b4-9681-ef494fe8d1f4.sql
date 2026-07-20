
-- RLS policies for mentor-attachments bucket: users can only access their own files;
-- admins can read all for support.
CREATE POLICY "Users upload own mentor attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'mentor-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users read own mentor attachments"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'mentor-attachments'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(), 'admin')
  )
);

CREATE POLICY "Users delete own mentor attachments"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'mentor-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
