-- Therapist natural-phrasing frequency audit
--
-- Purpose: calibrate Mentor bot system-prompt language against how real
-- therapists actually write, without ever exposing raw message content or
-- user identity. Returns ONLY aggregate counts per candidate phrase.
--
-- Workflow:
--   1. Run this in the Supabase SQL Editor.
--   2. Paste the resulting rows (topic, phrase, mention_count) — never raw
--      message text — into the phrasing review.
--   3. Update docs/therapist-natural-phrasing.md with whatever the counts
--      confirm or overturn.
--   4. Add new candidate phrases to the `candidates` CTE below whenever a
--      new tool/topic is designed, then re-run. The list is meant to grow.
--
-- Do NOT modify this query to SELECT m.content or any user/profile column —
-- the whole point is that phrasing calibration never needs raw quotes.

with candidates(topic, phrase) as (
  values
    ('getting_patients', 'גיוס מטופלים'),
    ('getting_patients', 'להביא מטופלים'),
    ('getting_patients', 'להשיג מטופלים'),
    ('getting_patients', 'לקבל מטופלים'),
    ('getting_patients', 'מטופלים פונים'),
    ('getting_patients', 'מטופלים מגיעים'),
    ('getting_patients', 'לגרום למטופלים לבוא'),
    ('advertising', 'פרסום'),
    ('advertising', 'שיווק'),
    ('advertising', 'קידום'),
    ('referrals', 'הפניות'),
    ('referrals', 'אנשי קשר'),
    ('referrals', 'מפנים'),
    ('pricing', 'תמחור'),
    ('pricing', 'שכר טרחה'),
    ('pricing', 'המחיר'),
    ('pricing', 'לגבות'),
    ('self_presentation', 'הצגה עצמית'),
    ('self_presentation', 'איך אני מציג את עצמי'),
    ('first_call', 'שיחת טלפון'),
    ('first_call', 'שיחת היכרות'),
    ('first_call', 'לקבוע פגישה')
)
select
  c.topic,
  c.phrase,
  count(*) filter (where m.content ilike '%' || c.phrase || '%') as mention_count
from candidates c
left join bot_messages m on m.role = 'user'
group by c.topic, c.phrase
order by c.topic, mention_count desc;
