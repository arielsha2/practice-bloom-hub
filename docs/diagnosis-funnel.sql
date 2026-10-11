-- Diagnosis funnel: how many started, reached the result, and clicked a purchase button.
-- Counts are distinct USERS (a person who repeats the diagnosis counts once).
-- Change the date in `params` to look at a window, e.g. from the day the WhatsApp invitation went out.
--
-- started        = at least one practice-diagnosis conversation with a user message
-- reached result = an assistant message carrying the [STAGE:4] marker (the recommendation stage).
--                  Chosen over diagnosis_lead_signals, which stopped receiving rows after 2026-09-07
--                  (51 rows vs. 87 journeys with a diagnosis_output), and over
--                  therapist_journeys.diagnosis_output, which is overwritten per run.
-- clicked        = a diagnosis_purchase_intents row (written when a purchase button is clicked,
--                  before the payment page opens). It is intent, not a purchase.
with params as (select timestamptz '2020-01-01 00:00:00+00' as since),
started as (
  select distinct c.user_id
  from bot_conversations c, params p
  where c.bot_key = 'practice-diagnosis'
    and c.created_at >= p.since
    and exists (select 1 from bot_messages m where m.conversation_id = c.id and m.role = 'user')
),
reached as (
  select distinct c.user_id
  from bot_conversations c, params p
  where c.bot_key = 'practice-diagnosis'
    and c.created_at >= p.since
    and exists (select 1 from bot_messages m
                where m.conversation_id = c.id and m.role = 'assistant' and m.content like '%[STAGE:4]%')
),
clicked as (
  select user_id, purchase_type
  from diagnosis_purchase_intents i, params p
  where i.clicked_at >= p.since
)
select 1 as ord, 'started the diagnosis' as step, (select count(*) from started) as users
union all select 2, 'reached the result (stage 4)', (select count(*) from reached)
union all select 3, 'clicked any purchase button', (select count(distinct user_id) from clicked)
union all select 4, '  of which: single tool', (select count(distinct user_id) from clicked where purchase_type = 'single_tool')
union all select 5, '  of which: full Mentor', (select count(distinct user_id) from clicked where purchase_type = 'full_mentor')
union all select 6, 'reached the result, then clicked', (select count(*) from reached where user_id in (select user_id from clicked))
order by ord;
