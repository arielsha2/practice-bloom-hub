-- Create secure view for qa_threads that hides user_id from other students
CREATE VIEW public.qa_threads_safe AS
SELECT 
  id,
  question,
  answer,
  is_public,
  created_at,
  answered_at,
  lesson_id,
  -- Show user_id only to the asker or admins
  CASE 
    WHEN user_id = auth.uid() THEN user_id
    WHEN public.has_role(auth.uid(), 'admin'::app_role) THEN user_id
    ELSE NULL
  END as user_id,
  -- Add boolean field to identify own questions
  (user_id = auth.uid()) as is_my_question
FROM public.qa_threads;

-- Grant access to the view
GRANT SELECT ON public.qa_threads_safe TO authenticated;

-- Add RLS policies for user_roles management (only admins)
CREATE POLICY "Admins can insert user roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update user roles" 
ON public.user_roles 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete user roles" 
ON public.user_roles 
FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'::app_role));