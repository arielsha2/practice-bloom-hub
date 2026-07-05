ALTER TABLE public.mentor_conversations
  ADD COLUMN IF NOT EXISTS messages_archive jsonb;