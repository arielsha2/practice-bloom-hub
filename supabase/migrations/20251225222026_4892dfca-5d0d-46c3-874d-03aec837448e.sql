-- Add course_member to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'course_member';