-- Wave 2, item 2.1: weekly_experiments table (belief-under-test capture at
-- the end of each tool) + the commitment question appended to each tool
-- bot's own prompt, mirroring Connection Bridge's confidence-question
-- pattern from Wave 1.3.

CREATE TABLE public.weekly_experiments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  bot_key text NOT NULL,
  stage text NOT NULL,
  action_text text NOT NULL,
  belief_under_test text NOT NULL DEFAULT '',
  expected_evidence text NOT NULL DEFAULT '',
  learning text NOT NULL DEFAULT '', -- filled by a later item, not this one
  status text NOT NULL DEFAULT 'pending', -- 'pending' | 'done' | 'skipped' | 'expired'
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE public.weekly_experiments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own weekly experiments"
  ON public.weekly_experiments
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all weekly experiments"
  ON public.weekly_experiments
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_weekly_experiments_user ON public.weekly_experiments (user_id, created_at DESC);

-- Append the commitment question to all 5 tool bots' own prompts. No
-- bot-specific anchor phrase needed (unlike Wave 1.3's connection-bridge
-- edit) since this applies uniformly regardless of each bot's internal
-- structure (open coaching flow vs. staged simulation).
UPDATE public.bot_configurations
SET system_prompt = system_prompt || E'\n\n═══════════════════════════════\nשאלת ההתחייבות לסיום (חובה):\n═══════════════════════════════\nלפני שמסיימים, שאל/י שאלה אחת, בטון שיחתי וטיפולי: "אם היינו עושים השבוע רק ניסוי קטן אחד — מה היית רוצה לבדוק? זה יכול להיות קטן מאוד — פחות מ-5 דקות, פנייה לאדם אחד, או ניסוח משפט אחד, כל עוד יש סיכוי טוב שבאמת תעשה/י את זה. אין תשובה נכונה, וגם אם זה לא ''יצליח'' — עדיין נלמד ממנו." חכ/י לתשובה לפני שממשיכים.'
WHERE bot_key IN ('niche-finder', 'self-presentation', 'pricing-calculator', 'contact-finder', 'connection-bridge');
