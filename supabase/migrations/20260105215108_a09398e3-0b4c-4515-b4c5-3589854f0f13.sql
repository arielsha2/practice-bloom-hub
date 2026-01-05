-- Fix qa_threads_safe view to use SECURITY INVOKER instead of SECURITY DEFINER
DROP VIEW IF EXISTS qa_threads_safe;

CREATE VIEW qa_threads_safe 
WITH (security_invoker = true)
AS
SELECT 
    id,
    question,
    answer,
    is_public,
    created_at,
    answered_at,
    lesson_id,
    CASE
        WHEN user_id = auth.uid() THEN user_id
        WHEN has_role(auth.uid(), 'admin'::app_role) THEN user_id
        ELSE NULL::uuid
    END AS user_id,
    user_id = auth.uid() AS is_my_question
FROM qa_threads;

-- Fix profiles table policies (RESTRICTIVE -> PERMISSIVE)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Fix lessons table policies
DROP POLICY IF EXISTS "Admins can manage lessons" ON public.lessons;
DROP POLICY IF EXISTS "Course members can view lessons" ON public.lessons;

CREATE POLICY "Admins can manage lessons"
ON public.lessons FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Course members can view lessons"
ON public.lessons FOR SELECT
TO authenticated
USING (is_course_member(auth.uid()));

-- Fix user_lesson_progress table policies
DROP POLICY IF EXISTS "Users can view own progress" ON public.user_lesson_progress;
DROP POLICY IF EXISTS "Admins can view all progress" ON public.user_lesson_progress;
DROP POLICY IF EXISTS "Users can insert own progress" ON public.user_lesson_progress;
DROP POLICY IF EXISTS "Users can update own progress" ON public.user_lesson_progress;

CREATE POLICY "Users can view own progress"
ON public.user_lesson_progress FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all progress"
ON public.user_lesson_progress FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert own progress"
ON public.user_lesson_progress FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
ON public.user_lesson_progress FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Fix user_roles table policies
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete user roles" ON public.user_roles;

CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can insert user roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update user roles"
ON public.user_roles FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete user roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix qa_threads table policies
DROP POLICY IF EXISTS "Course members can view public questions and own questions" ON public.qa_threads;
DROP POLICY IF EXISTS "Course members can ask questions" ON public.qa_threads;
DROP POLICY IF EXISTS "Admins can manage questions" ON public.qa_threads;
DROP POLICY IF EXISTS "Admins can delete questions" ON public.qa_threads;

CREATE POLICY "Course members can view public questions and own questions"
ON public.qa_threads FOR SELECT
TO authenticated
USING (is_course_member(auth.uid()) AND ((is_public = true) OR (user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)));

CREATE POLICY "Course members can ask questions"
ON public.qa_threads FOR INSERT
TO authenticated
WITH CHECK (is_course_member(auth.uid()) AND (user_id = auth.uid()));

CREATE POLICY "Admins can manage questions"
ON public.qa_threads FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete questions"
ON public.qa_threads FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix lesson_resources table policies
DROP POLICY IF EXISTS "Admins can manage resources" ON public.lesson_resources;
DROP POLICY IF EXISTS "Course members can view resources" ON public.lesson_resources;

CREATE POLICY "Admins can manage resources"
ON public.lesson_resources FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Course members can view resources"
ON public.lesson_resources FOR SELECT
TO authenticated
USING (is_course_member(auth.uid()));

-- Fix media_library table policies
DROP POLICY IF EXISTS "Admins can manage media library" ON public.media_library;
DROP POLICY IF EXISTS "Course members can view media library" ON public.media_library;

CREATE POLICY "Admins can manage media library"
ON public.media_library FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Course members can view media library"
ON public.media_library FOR SELECT
TO authenticated
USING (is_course_member(auth.uid()));

-- Fix lesson_media_links table policies
DROP POLICY IF EXISTS "Admins can manage lesson media links" ON public.lesson_media_links;
DROP POLICY IF EXISTS "Course members can view lesson media links" ON public.lesson_media_links;

CREATE POLICY "Admins can manage lesson media links"
ON public.lesson_media_links FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Course members can view lesson media links"
ON public.lesson_media_links FOR SELECT
TO authenticated
USING (is_course_member(auth.uid()));

-- Fix contents table policies
DROP POLICY IF EXISTS "Anyone can read published contents" ON public.contents;
DROP POLICY IF EXISTS "Admins can insert contents" ON public.contents;
DROP POLICY IF EXISTS "Admins can update contents" ON public.contents;
DROP POLICY IF EXISTS "Admins can delete contents" ON public.contents;

CREATE POLICY "Anyone can read published contents"
ON public.contents FOR SELECT
USING (is_published = true);

CREATE POLICY "Admins can insert contents"
ON public.contents FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update contents"
ON public.contents FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete contents"
ON public.contents FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));