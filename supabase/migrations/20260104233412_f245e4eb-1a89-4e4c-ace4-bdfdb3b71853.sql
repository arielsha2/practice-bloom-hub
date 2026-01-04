-- Create user_lesson_progress table for tracking watched lessons
CREATE TABLE public.user_lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  video_id UUID REFERENCES public.media_library(id) ON DELETE SET NULL,
  watched BOOLEAN DEFAULT false,
  last_position_seconds INTEGER DEFAULT 0,
  last_watched_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, lesson_id, video_id)
);

-- Enable RLS
ALTER TABLE public.user_lesson_progress ENABLE ROW LEVEL SECURITY;

-- Users can view their own progress
CREATE POLICY "Users can view own progress" 
ON public.user_lesson_progress 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own progress
CREATE POLICY "Users can insert own progress" 
ON public.user_lesson_progress 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own progress
CREATE POLICY "Users can update own progress" 
ON public.user_lesson_progress 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_user_lesson_progress_user_id ON public.user_lesson_progress(user_id);
CREATE INDEX idx_user_lesson_progress_lesson_id ON public.user_lesson_progress(lesson_id);