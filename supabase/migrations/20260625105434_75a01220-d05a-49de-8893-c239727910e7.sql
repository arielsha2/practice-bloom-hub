
ALTER TABLE public.mentor_conversations
  ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'he';

DO $$
DECLARE
  rec RECORD;
  merged jsonb;
  keep_id uuid;
  m_row jsonb;
  prev_role text;
  prev_content text;
  out_arr jsonb;
  insights int;
BEGIN
  FOR rec IN
    SELECT user_id, language
    FROM public.mentor_conversations
    GROUP BY user_id, language
    HAVING COUNT(*) > 1
  LOOP
    SELECT
      COALESCE(jsonb_agg(sub.m ORDER BY sub.started_at ASC, sub.ord ASC), '[]'::jsonb),
      (SELECT id FROM public.mentor_conversations
        WHERE user_id = rec.user_id AND language = rec.language
        ORDER BY started_at ASC LIMIT 1)
    INTO merged, keep_id
    FROM (
      SELECT mc.started_at, t.ord, t.msg AS m
      FROM public.mentor_conversations mc,
           LATERAL jsonb_array_elements(COALESCE(mc.messages, '[]'::jsonb)) WITH ORDINALITY AS t(msg, ord)
      WHERE mc.user_id = rec.user_id AND mc.language = rec.language
    ) sub;

    out_arr := '[]'::jsonb;
    prev_role := NULL;
    prev_content := NULL;
    FOR m_row IN SELECT * FROM jsonb_array_elements(merged)
    LOOP
      IF prev_role IS DISTINCT FROM (m_row->>'role')
         OR prev_content IS DISTINCT FROM (m_row->>'content') THEN
        out_arr := out_arr || jsonb_build_array(m_row);
        prev_role := m_row->>'role';
        prev_content := m_row->>'content';
      END IF;
    END LOOP;

    SELECT COALESCE(SUM(
      (SELECT COUNT(*) FROM regexp_matches(elem->>'content', '\[INSIGHT\]', 'gi'))
    ), 0)::int
    INTO insights
    FROM jsonb_array_elements(out_arr) AS elem
    WHERE elem->>'role' = 'assistant';

    UPDATE public.mentor_conversations
    SET messages = out_arr, insight_count = insights, updated_at = now()
    WHERE id = keep_id;

    DELETE FROM public.mentor_conversations
    WHERE user_id = rec.user_id AND language = rec.language AND id <> keep_id;
  END LOOP;
END $$;

ALTER TABLE public.mentor_conversations
  DROP CONSTRAINT IF EXISTS mentor_conversations_user_language_unique;
ALTER TABLE public.mentor_conversations
  ADD CONSTRAINT mentor_conversations_user_language_unique UNIQUE (user_id, language);
